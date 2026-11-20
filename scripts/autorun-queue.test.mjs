import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { handleDurableQueueRequest } from "../infra/autorun/control-api/src/queue.js";

const migration = await readFile(new URL("../infra/autorun/migrations/0002_durable_queue.sql", import.meta.url), "utf8");
const token = "test-runner-secret-not-for-production";
const tokenHash = createHash("sha256").update(token).digest("hex");
let sqlite;
let env;

class D1Statement {
  constructor(db, sql, values = []) { this.db = db; this.sql = sql; this.values = values; }
  bind(...values) { return new D1Statement(this.db, this.sql, values); }
  async run() {
    const result = this.db.prepare(this.sql).run(...this.values);
    return { meta: { changes: Number(result.changes) } };
  }
  async first() { return this.db.prepare(this.sql).get(...this.values) ?? null; }
  async all() { return { results: this.db.prepare(this.sql).all(...this.values) }; }
}

function call(path, { method = "GET", body, auth = true } = {}) {
  const headers = new Headers();
  if (auth) headers.set("authorization", `Bearer ${token}`);
  if (body !== undefined) headers.set("content-type", "application/json");
  return handleDurableQueueRequest(new Request(`https://control.test${path}`, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body),
  }), env);
}

async function enqueue(key = `key-${crypto.randomUUID()}`) {
  const response = await call("/api/v1/autorun/queue/jobs", {
    method: "POST",
    body: {
      idempotencyKey: key,
      repository: "OCodejs/mcp.auth.ocodejs",
      branch: "feat/staging-check",
      commitSha: "a".repeat(40),
      commandIds: ["npm_ci", "npm_test"],
      requestedBy: "test-suite",
    },
  });
  assert.equal(response.status, 202);
  return (await response.json()).job;
}

async function claim(runnerId = "runner-test-01") {
  const response = await call("/api/v1/autorun/queue/claim", {
    method: "POST", body: { runnerId, leaseSeconds: 30 },
  });
  assert.equal(response.status, 200);
  return (await response.json()).job;
}

beforeEach(() => {
  sqlite = new DatabaseSync(":memory:");
  sqlite.exec(migration);
  env = {
    AUTORUN_RUNNER_TOKEN_SHA256: tokenHash,
    ALLOWED_JOB_REPOSITORIES: "OCodejs/mcp.auth.ocodejs",
    ALLOWED_COMMAND_IDS: "npm_ci,npm_test",
    DB: { prepare(sql) { return new D1Statement(sqlite, sql); } },
  };
});

test("queue fails closed when runner authentication is absent or invalid", async () => {
  const missing = await call("/api/v1/autorun/queue/jobs", { method: "POST", body: {}, auth: false });
  assert.equal(missing.status, 401);
  env.AUTORUN_RUNNER_TOKEN_SHA256 = "";
  const unconfigured = await call("/api/v1/autorun/queue/jobs", { method: "POST", body: {} });
  assert.equal(unconfigured.status, 503);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS count FROM autorun_jobs").get().count, 0);
});

test("enqueue is idempotent and rejects untrusted repositories and commands", async () => {
  const key = "same-request-key-0001";
  const first = await enqueue(key);
  const second = await enqueue(key);
  assert.equal(first.job_id, second.job_id);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS count FROM autorun_jobs").get().count, 1);

  const badRepo = await call("/api/v1/autorun/queue/jobs", {
    method: "POST", body: {
      idempotencyKey: "bad-repo-key-0001", repository: "attacker/repo", branch: "main",
      commitSha: "b".repeat(40), commandIds: ["npm_test"],
    },
  });
  assert.equal(badRepo.status, 403);

  const badCommand = await call("/api/v1/autorun/queue/jobs", {
    method: "POST", body: {
      idempotencyKey: "bad-command-key-01", repository: "OCodejs/mcp.auth.ocodejs", branch: "main",
      commitSha: "b".repeat(40), commandIds: ["curl"],
    },
  });
  assert.equal(badCommand.status, 400);
});

test("concurrent claim attempts cannot lease the same job twice", async () => {
  await enqueue("claim-race-key-0001");
  const [left, right] = await Promise.all([claim("runner-left"), claim("runner-right")]);
  assert.equal(Number(Boolean(left)) + Number(Boolean(right)), 1);
  const saved = sqlite.prepare("SELECT status,attempt,lease_owner FROM autorun_jobs").get();
  assert.equal(saved.status, "leased");
  assert.equal(saved.attempt, 1);
});

test("an expired lease is recovered and claimed by a replacement runner after restart", async () => {
  await enqueue("restart-recovery-key-01");
  const first = await claim("runner-before-restart");
  assert.ok(first?.leaseToken);
  sqlite.prepare("UPDATE autorun_jobs SET lease_expires_at=? WHERE job_id=?")
    .run("2000-01-01T00:00:00.000Z", first.job_id);

  const recovered = await claim("runner-after-restart");
  assert.equal(recovered.job_id, first.job_id);
  assert.equal(recovered.attempt, 2);
  assert.equal(sqlite.prepare("SELECT status FROM autorun_jobs WHERE job_id=?").get(first.job_id).status, "leased");
});

test("timed-out jobs retry within the attempt budget then become terminal", async () => {
  await enqueue("timeout-retry-key-001");
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const job = await claim(`runner-timeout-${attempt}`);
    assert.equal(job.attempt, attempt);
    const response = await call("/api/v1/autorun/queue/complete", {
      method: "POST",
      body: { jobId: job.job_id, runnerId: `runner-timeout-${attempt}`, leaseToken: job.leaseToken, outcome: "timed_out", error: "test timeout" },
    });
    assert.equal(response.status, 200);
    if (attempt < 3) {
      sqlite.prepare("UPDATE autorun_jobs SET available_at=? WHERE job_id=?").run("2000-01-01T00:00:00.000Z", job.job_id);
    } else {
      assert.equal((await response.json()).status, "timed_out");
    }
  }
});

test("running job cancellation is visible to heartbeat and becomes terminal on completion", async () => {
  await enqueue("cancel-running-key-01");
  const job = await claim("runner-cancel");
  await call("/api/v1/autorun/queue/start", {
    method: "POST", body: { jobId: job.job_id, runnerId: "runner-cancel", leaseToken: job.leaseToken },
  });
  const cancelled = await call("/api/v1/autorun/queue/cancel", { method: "POST", body: { jobId: job.job_id } });
  assert.equal((await cancelled.json()).cancel_requested, 1);

  const heartbeat = await call("/api/v1/autorun/queue/heartbeat", {
    method: "POST", body: { jobId: job.job_id, runnerId: "runner-cancel", leaseToken: job.leaseToken },
  });
  assert.equal((await heartbeat.json()).cancelRequested, true);

  const completed = await call("/api/v1/autorun/queue/complete", {
    method: "POST", body: { jobId: job.job_id, runnerId: "runner-cancel", leaseToken: job.leaseToken, outcome: "succeeded" },
  });
  assert.equal((await completed.json()).status, "cancelled");
});

test("queue event history is append-only for enqueue, claim, retry and terminal transitions", async () => {
  const job = await enqueue("event-history-key-01");
  const claimed = await claim("runner-events");
  await call("/api/v1/autorun/queue/complete", {
    method: "POST", body: { jobId: claimed.job_id, runnerId: "runner-events", leaseToken: claimed.leaseToken, outcome: "succeeded" },
  });
  const events = sqlite.prepare("SELECT event_type,status FROM autorun_job_events WHERE job_id=? ORDER BY event_id").all(job.job_id);
  assert.deepEqual(events.map((item) => item.status), ["queued", "leased", "succeeded"]);
});
