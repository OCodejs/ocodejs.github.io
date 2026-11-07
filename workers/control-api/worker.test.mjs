import test from "node:test";
import assert from "node:assert/strict";
import worker from "./worker.mjs";

const env = { ALLOWED_ORIGINS: "https://ocodejs.github.io,https://staging.ocodejs.dev" };
const call = (path, options = {}) => worker.fetch(
  new Request(`https://api-staging.example.workers.dev${path}`, options),
  env
);

test("liveness reports this API process only", async () => {
  const response = await call("/api/v1/health/live");
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.live, true);
  assert.equal(body.service, "control-api");
  assert.ok(body.checkedAt);
  assert.ok(body.requestId);
});

test("readiness does not claim downstream dependencies are configured", async () => {
  const response = await call("/api/v1/health/ready");
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.ready, true);
  assert.deepEqual(body.dependencies, []);
  assert.match(body.note, /not configured/);
});

test("service registry distinguishes real API health from unconfigured services", async () => {
  const response = await call("/api/v1/services");
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.services.find((item) => item.id === "control-api").state, "healthy");
  assert.equal(body.services.find((item) => item.id === "identity").state, "not_configured");
  assert.equal(body.services.find((item) => item.id === "ai-runtime").state, "not_configured");
  assert.equal(body.count, body.services.length);
});

test("single service lookup returns 404 for unknown service IDs", async () => {
  const response = await call("/api/v1/services/does-not-exist");
  const body = await response.json();
  assert.equal(response.status, 404);
  assert.equal(body.error.code, "NOT_FOUND");
});

test("unknown routes return a stable error envelope", async () => {
  const response = await call("/missing");
  const body = await response.json();
  assert.equal(response.status, 404);
  assert.equal(body.error.code, "NOT_FOUND");
  assert.ok(body.requestId);
});

test("write methods are rejected", async () => {
  const response = await call("/api/v1/services", { method: "POST" });
  const body = await response.json();
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("Allow"), "GET, OPTIONS");
  assert.equal(body.error.code, "METHOD_NOT_ALLOWED");
});

test("CORS allows only configured origins", async () => {
  const allowed = await call("/api/v1/health/live", {
    headers: { Origin: "https://ocodejs.github.io" }
  });
  assert.equal(allowed.headers.get("Access-Control-Allow-Origin"), "https://ocodejs.github.io");

  const denied = await call("/api/v1/health/live", {
    headers: { Origin: "https://attacker.example" }
  });
  assert.equal(denied.headers.get("Access-Control-Allow-Origin"), null);
});

test("preflight is read-only and returns no body", async () => {
  const response = await call("/api/v1/services", {
    method: "OPTIONS",
    headers: { Origin: "https://ocodejs.github.io" }
  });
  assert.equal(response.status, 204);
  assert.equal(await response.text(), "");
});

test("responses include no-store and nosniff security headers", async () => {
  const response = await call("/api/v1/services");
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
});


test("GitHub Pages production origin is allowed by the staging API", async () => {
  const response = await worker.fetch(
    new Request("https://api-staging.example.workers.dev/api/v1/services", {
      headers: { Origin: "https://ocodejs.github.io" }
    }),
    {}
  );
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), "https://ocodejs.github.io");
});
