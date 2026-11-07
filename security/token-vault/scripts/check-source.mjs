import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const workerPath = fileURLToPath(new URL("src/worker.js", root));
const schemaPath = fileURLToPath(new URL("schema.sql", root));
const passwordPath = fileURLToPath(new URL("scripts/hash-password.mjs", root));
const worker = readFileSync(workerPath, "utf8");
const schema = readFileSync(schemaPath, "utf8");
const passwordScript = readFileSync(passwordPath, "utf8");

for (const path of [workerPath, passwordPath]) {
  const result = spawnSync(process.execPath, ["--check", path], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || "Node syntax check failed: " + path);
}
for (const marker of [
  "origin === new URL(req.url).origin",
  'crypto.subtle.verify("HMAC"',
  'SameSite=Strict',
  "i.role",
  "AES-GCM",
  'rateLimit(req, env, "login")',
  'rateLimit(req, env, "reveal")',
  'path === "/vault"',
  "authenticateAgent",
  "agent_project_grants",
  "agent.token.reveal",
  "validProject(projectId)",
  '"cache-control": "no-store, max-age=0"'
]) assert.ok(worker.includes(marker), "Missing security invariant: " + marker);
assert.ok(!worker.includes("!origin ||"), "Missing Origin must not be accepted");
assert.ok(schema.includes("CREATE TABLE IF NOT EXISTS sessions"));
assert.ok(schema.includes("CREATE TABLE IF NOT EXISTS audit_events"));
assert.ok(passwordScript.includes("code === 13 || code === 10"), "Password utility must finish on Enter");
assert.ok(passwordScript.includes("password.length < 16"), "Bootstrap password must be at least 16 chars");
assert.ok(!/sk-[A-Za-z0-9]{20,}/.test(worker + passwordScript), "Possible hard-coded provider token");
console.log("Token Vault source validation passed.");

assert.ok(schema.includes("CREATE TABLE IF NOT EXISTS agent_credentials"));
assert.ok(schema.includes("CREATE TABLE IF NOT EXISTS agent_project_grants"));
assert.ok(schema.includes("project_id TEXT NOT NULL DEFAULT 'ocodejs-core'"));
