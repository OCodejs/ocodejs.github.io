import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/worker.js";

test("login screen is served without exposing a vault session", async () => {
  const response = await worker.fetch(new Request("https://vault.example/"), {});
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/html/);
  assert.equal(response.headers.get("cache-control"), "no-store, max-age=0");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.match(await response.text(), /MASTER PASSWORD/);
});

test("vault route fails closed until Cloudflare bindings and secrets exist", async () => {
  const response = await worker.fetch(new Request("https://vault.example/vault"), {});
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("cache-control"), "no-store, max-age=0");
});

test("state-changing requests without an Origin header are rejected", async () => {
  const response = await worker.fetch(new Request("https://vault.example/api/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password: "not-a-real-password" })
  }), {});
  assert.equal(response.status, 403);
});

test("cross-origin login requests are rejected before secret checks", async () => {
  const response = await worker.fetch(new Request("https://vault.example/api/login", {
    method: "POST",
    headers: {
      origin: "https://attacker.example",
      "sec-fetch-site": "cross-site",
      "content-type": "application/json"
    },
    body: JSON.stringify({ password: "not-a-real-password" })
  }), {});
  assert.equal(response.status, 403);
});

test("same-origin login fails closed when secrets are not configured", async () => {
  const response = await worker.fetch(new Request("https://vault.example/api/login", {
    method: "POST",
    headers: {
      origin: "https://vault.example",
      "sec-fetch-site": "same-origin",
      "content-type": "application/json"
    },
    body: JSON.stringify({ password: "not-a-real-password" })
  }), {});
  assert.equal(response.status, 503);
});
