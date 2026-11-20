import test, { after, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { webcrypto } from "node:crypto";

globalThis.crypto ??= webcrypto;

const workerSource = await readFile(
  new URL("../infra/autorun/control-api/src/index.js", import.meta.url),
  "utf8",
);
const { default: worker } = await import(
  `data:text/javascript;base64,${Buffer.from(workerSource).toString("base64")}`
);

const workflowPath = new URL("../.github/workflows/autorun-events.yml", import.meta.url);
const workflowSource = await readFile(workflowPath, "utf8");
const originalFetch = globalThis.fetch;
let keyPair;
let jwks;
let dbCalls;

const env = {
  ALLOWED_REPOSITORY: "OCodejs/ocodejs.github.io",
  ALLOWED_WORKFLOW_REF:
    "OCodejs/ocodejs.github.io/.github/workflows/autorun-events.yml@refs/heads/main",
  DB: {
    prepare(sql) {
      return {
        bind(...values) {
          return {
            async run() {
              dbCalls.push({ sql, values, operation: "run" });
              return { success: true };
            },
            async first() {
              dbCalls.push({ sql, values, operation: "first" });
              return { total: 2, running: 1, queued: 1, succeeded: 0, failed: 0 };
            },
            async all() {
              dbCalls.push({ sql, values, operation: "all" });
              return { results: [{ run_id: "123", status: "in_progress" }] };
            },
          };
        },
      };
    },
  },
};

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

async function issueToken(overrides = {}) {
  const now = Math.floor(Date.now() / 1000);
  const header = encode({ alg: "RS256", typ: "JWT", kid: "autorun-test-key" });
  const claims = {
    iss: "https://token.actions.githubusercontent.com",
    aud: "ocodejs-autorun-staging",
    iat: now,
    nbf: now - 1,
    exp: now + 300,
    repository: "OCodejs/ocodejs.github.io",
    repository_id: "1449322239",
    workflow_ref:
      "OCodejs/ocodejs.github.io/.github/workflows/autorun-events.yml@refs/heads/main",
    event_name: "workflow_run",
    ref: "refs/heads/main",
    actor: "zskbot",
    ...overrides,
  };
  const payload = encode(claims);
  const unsigned = `${header}.${payload}`;
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    keyPair.privateKey,
    new TextEncoder().encode(unsigned),
  );
  return `${unsigned}.${Buffer.from(signature).toString("base64url")}`;
}

function eventPayload(overrides = {}) {
  return {
    action: "completed",
    workflow_run: {
      id: 123,
      run_attempt: 1,
      name: "Control API checks",
      event: "push",
      head_branch: "main",
      head_sha: "a".repeat(40),
      status: "completed",
      conclusion: "success",
      html_url: "https://github.com/OCodejs/ocodejs.github.io/actions/runs/123",
      created_at: "2026-11-20T00:00:00Z",
      run_started_at: "2026-11-20T00:00:01Z",
      updated_at: "2026-11-20T00:00:02Z",
      repository: { id: 1449322239, full_name: "OCodejs/ocodejs.github.io" },
      ...overrides,
    },
  };
}

async function request(path, { method = "GET", token, body } = {}) {
  const headers = new Headers();
  if (token) headers.set("authorization", `Bearer ${token}`);
  if (body !== undefined) headers.set("content-type", "application/json");
  return worker.fetch(
    new Request(`https://staging.example${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
    env,
  );
}

before(async () => {
  keyPair = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  );
  const publicJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
  jwks = { keys: [{ ...publicJwk, kid: "autorun-test-key", alg: "RS256", use: "sig" }] };
  globalThis.fetch = async (url) => {
    assert.match(String(url), /token\.actions\.githubusercontent\.com/);
    return Response.json(jwks);
  };
});

after(() => {
  globalThis.fetch = originalFetch;
});

beforeEach(() => {
  dbCalls = [];
});

test("workflow bridge is gated by workflow_run and grants only read + OIDC permissions", () => {
  assert.match(workflowSource, /workflow_run:/);
  assert.match(workflowSource, /types:\s*\[requested, in_progress, completed\]/);
  assert.match(workflowSource, /contents:\s*read/);
  assert.match(workflowSource, /id-token:\s*write/);
  assert.match(
    workflowSource,
    /workflow_run\.repository\.full_name == github\.repository/,
  );
  assert.match(workflowSource, /audience.*ocodejs-autorun-staging/s);
});

test("GET /health/live returns a no-store health response", async () => {
  const response = await request("/health/live");
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    service: "ocodejs-autorun-control-staging",
    storage: "d1",
  });
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("summary and jobs endpoints query D1", async () => {
  const summary = await request("/api/v1/autorun/summary");
  assert.equal(summary.status, 200);
  assert.equal((await summary.json()).summary.total, 2);

  const jobs = await request("/api/v1/autorun/jobs?limit=10");
  assert.equal(jobs.status, 200);
  assert.equal((await jobs.json()).count, 1);
  assert.equal(dbCalls.filter((call) => call.operation === "first").length, 1);
  assert.equal(dbCalls.filter((call) => call.operation === "all").length, 1);
});

test("event ingestion rejects a missing bearer token before touching D1", async () => {
  const response = await request("/api/v1/autorun/events", {
    method: "POST",
    body: eventPayload(),
  });
  assert.equal(response.status, 401);
  assert.equal(dbCalls.length, 0);
});

test("event ingestion rejects invalid OIDC identity claims", async (t) => {
  for (const [label, claims] of [
    ["issuer", { iss: "https://attacker.example" }],
    ["audience", { aud: "wrong-audience" }],
    ["repository", { repository: "attacker/repo" }],
    ["workflow ref", { workflow_ref: "attacker/workflow.yml@refs/heads/main" }],
    ["event type", { event_name: "push" }],
    ["ref", { ref: "refs/heads/feature" }],
    ["expired token", { exp: 1 }],
  ]) {
    await t.test(label, async () => {
      const response = await request("/api/v1/autorun/events", {
        method: "POST",
        token: await issueToken(claims),
        body: eventPayload(),
      });
      assert.equal(response.status, 401);
      assert.equal(dbCalls.length, 0);
    });
  }
});

test("event ingestion rejects repository ID mismatch", async () => {
  const payload = eventPayload();
  payload.workflow_run.repository.id = 999;
  const response = await request("/api/v1/autorun/events", {
    method: "POST",
    token: await issueToken(),
    body: payload,
  });
  assert.equal(response.status, 403);
  assert.equal(dbCalls.length, 0);
});

test("valid workflow_run event is persisted to both D1 tables", async () => {
  const response = await request("/api/v1/autorun/events", {
    method: "POST",
    token: await issueToken(),
    body: eventPayload(),
  });
  assert.equal(response.status, 202);
  assert.equal((await response.json()).ok, true);
  assert.equal(dbCalls.length, 2);
  assert.match(dbCalls[0].sql, /INSERT INTO autorun_runs/);
  assert.match(dbCalls[1].sql, /INSERT OR IGNORE INTO autorun_events/);
  assert.equal(dbCalls[1].values[0], "123:1:completed");
  assert.equal(dbCalls[1].values[5], env.ALLOWED_WORKFLOW_REF);
});

test("event ingestion rejects malformed payloads without writing", async () => {
  const response = await request("/api/v1/autorun/events", {
    method: "POST",
    token: await issueToken(),
    body: { action: "completed" },
  });
  assert.equal(response.status, 400);
  assert.equal(dbCalls.length, 0);
});
