import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { pbkdf2Sync, randomBytes } from "node:crypto";
import worker from "../src/worker.js";

class D1Statement {
  constructor(db, sql) { this.db = db; this.sql = sql; this.args = []; }
  bind(...args) { this.args = args; return this; }
  first() { return this.db.sqlite.prepare(this.sql).get(...this.args) ?? null; }
  all() { return { results: this.db.sqlite.prepare(this.sql).all(...this.args) }; }
  run() {
    const result = this.db.sqlite.prepare(this.sql).run(...this.args);
    return { meta: { changes: Number(result.changes) } };
  }
}
class D1Mock {
  constructor() {
    this.sqlite = new DatabaseSync(":memory:");
    this.sqlite.exec(readFileSync(new URL("../schema.sql", import.meta.url), "utf8"));
  }
  prepare(sql) { return new D1Statement(this, sql); }
  batch(statements) {
    this.sqlite.exec("BEGIN");
    try {
      for (const statement of statements) this.sqlite.prepare(statement.sql).run(...statement.args);
      this.sqlite.exec("COMMIT");
    } catch (error) {
      this.sqlite.exec("ROLLBACK");
      throw error;
    }
  }
}
function makeEnv() {
  const password = "vault-test-password-2026";
  const salt = randomBytes(16);
  const verifier = salt.toString("base64") + ":" + pbkdf2Sync(password, salt, 310000, 32, "sha256").toString("base64");
  return {
    password,
    env: {
      DB: new D1Mock(),
      BOOTSTRAP_PASSWORD_HASH: verifier,
      SESSION_SIGNING_KEY: randomBytes(32).toString("base64"),
      TOKEN_ENCRYPTION_KEY: randomBytes(32).toString("base64")
    }
  };
}
function browserHeaders(cookie) {
  return {
    origin: "https://vault.example",
    "sec-fetch-site": "same-origin",
    "content-type": "application/json",
    ...(cookie ? { cookie } : {})
  };
}
async function call(path, env, { method = "GET", body, headers = {} } = {}) {
  return worker.fetch(new Request("https://vault.example" + path, {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  }), env);
}

test("AI agent grants isolate projects and reveal permission, and revocation works", async () => {
  const { env, password } = makeEnv();
  const login = await call("/api/login", env, {
    method: "POST",
    headers: browserHeaders(),
    body: { password }
  });
  assert.equal(login.status, 200);
  const cookie = login.headers.get("set-cookie").split(";")[0];

  const createToken = async (label, project_id, value) => {
    const response = await call("/api/tokens", env, {
      method: "POST",
      headers: browserHeaders(cookie),
      body: { label, provider: "test-provider", project_id, value }
    });
    assert.equal(response.status, 201);
    return (await response.json()).id;
  };
  const alphaToken = await createToken("alpha-secret", "project-alpha", "alpha-secret-value");
  const betaToken = await createToken("beta-secret", "project-beta", "beta-secret-value");

  const createAgent = await call("/api/agents", env, {
    method: "POST",
    headers: browserHeaders(cookie),
    body: { subject: "agent-integration-test", expires_in_days: 7 }
  });
  assert.equal(createAgent.status, 201);
  const { api_key: apiKey } = await createAgent.json();
  assert.match(apiKey, /^oca_[A-Za-z0-9_-]{40,64}$/);

  const grant = async (project_id, permission) => call("/api/agents/agent-integration-test/grants", env, {
    method: "POST",
    headers: browserHeaders(cookie),
    body: { project_id, permission }
  });
  assert.equal((await grant("project-alpha", "reveal")).status, 200);
  assert.equal((await grant("project-beta", "metadata")).status, 200);

  const bearer = { authorization: "Bearer " + apiKey, "cf-connecting-ip": "203.0.113.8" };
  const alphaList = await call("/api/agent/tokens?project_id=project-alpha", env, { headers: bearer });
  assert.equal(alphaList.status, 200);
  assert.deepEqual((await alphaList.json()).tokens.map(t => t.id), [alphaToken]);

  const crossProject = await call("/api/agent/tokens?project_id=project-gamma", env, { headers: bearer });
  assert.equal(crossProject.status, 403);

  const revealAlpha = await call("/api/agent/tokens/" + alphaToken + "/reveal", env, {
    method: "POST", headers: bearer, body: {}
  });
  assert.equal(revealAlpha.status, 200);
  assert.equal((await revealAlpha.json()).value, "alpha-secret-value");

  const revealBeta = await call("/api/agent/tokens/" + betaToken + "/reveal", env, {
    method: "POST", headers: bearer, body: {}
  });
  assert.equal(revealBeta.status, 403);

  const revoke = await call("/api/agents/agent-integration-test", env, {
    method: "DELETE", headers: browserHeaders(cookie)
  });
  assert.equal(revoke.status, 200);

  const afterRevoke = await call("/api/agent/tokens?project_id=project-alpha", env, { headers: bearer });
  assert.equal(afterRevoke.status, 401);
});
