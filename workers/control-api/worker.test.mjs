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

test("service registry probes CLI Auth and MCP while keeping Account Auth.js separate", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    if (url === "https://auth.ocodejs.dev/health") {
      assert.equal(options.redirect, "error");
      return new Response(JSON.stringify({
        ok: true,
        service: "ocodejs-auth-worker",
        patConfigured: true,
        oauthConfigured: true
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    assert.equal(url, "https://ocodejs-mcp-staging.huynhthuongg2505-f9b.workers.dev/mcp");
    const message = JSON.parse(options.body);
    if (message.method === "initialize") {
      return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: {
        protocolVersion: "2025-03-26",
        serverInfo: { name: "ocodejs-control-center" }
      }}), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    assert.equal(options.headers["MCP-Protocol-Version"], "2025-03-26");
    if (message.method === "notifications/initialized") return new Response(null, { status: 202 });
    if (message.method === "tools/list") {
      return new Response(JSON.stringify({ jsonrpc: "2.0", id: 2, result: { tools: [
        { name: "get_control_api_health" }, { name: "list_services" }, { name: "list_agents" }, { name: "get_agent_definition" }
      ]}}), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    throw new Error("Unexpected MCP method");
  };
  try {
    const response = await call("/api/v1/services");
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.services.find((item) => item.id === "control-api").state, "healthy");
    assert.equal(body.services.find((item) => item.id === "identity").state, "not_configured");
    assert.equal(body.services.find((item) => item.id === "cli-auth").state, "healthy");
    assert.equal(body.services.find((item) => item.id === "cli-auth").source, "remote_probe");
    assert.equal(body.services.find((item) => item.id === "mcp-server").state, "healthy");
    assert.equal(body.services.find((item) => item.id === "mcp-server").toolCount, 4);
    assert.equal(body.count, body.services.length);
  } finally {
    globalThis.fetch = originalFetch;
  }
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


test("CLI Auth is degraded when required provider bindings are incomplete", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    ok: true, service: "ocodejs-auth-worker", patConfigured: true, oauthConfigured: false
  }), { status: 200, headers: { "Content-Type": "application/json" } });
  try {
    const response = await call("/api/v1/services/cli-auth");
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.service.state, "degraded");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("CLI Auth is unavailable when its health endpoint fails", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response("upstream unavailable", { status: 503 });
  try {
    const response = await call("/api/v1/services/cli-auth");
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.service.state, "unavailable");
    assert.equal(body.service.latencyMs >= 0, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});


test("MCP service is unknown when protocol contract mismatches", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: {
    protocolVersion: "2024-11-05",
    serverInfo: { name: "unexpected-server" }
  }}), { status: 200, headers: { "Content-Type": "application/json" } });
  try {
    const response = await call("/api/v1/services/mcp-server");
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.service.state, "unknown");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("MCP service is unavailable when the staging endpoint cannot be reached", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response("unavailable", { status: 503 });
  try {
    const response = await call("/api/v1/services/mcp-server");
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.service.state, "unavailable");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("emits structured request logs with correlation headers and excludes query strings", async () => {
  const originalLog = console.log;
  const events = [];
  console.log = (line) => events.push(JSON.parse(line));
  try {
    const response = await call("/api/v1/health/live?access_token=must-not-be-logged", {
      headers: { "x-request-id": "req-safe-123" }
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("X-Request-Id"), "req-safe-123");
    assert.match(response.headers.get("Server-Timing") || "", /^app;dur=\d+$/);
    assert.equal(events.length, 1);
    assert.deepEqual({
      event: events[0].event,
      requestId: events[0].requestId,
      method: events[0].method,
      path: events[0].path,
      status: events[0].status
    }, {
      event: "control_api.request",
      requestId: "req-safe-123",
      method: "GET",
      path: "/api/v1/health/live",
      status: 200
    });
    assert.equal(JSON.stringify(events).includes("must-not-be-logged"), false);
  } finally {
    console.log = originalLog;
  }
});

test("telemetry reports partial structured logging without claiming metrics storage", async () => {
  const response = await call("/api/v1/services/telemetry");
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.service.state, "degraded");
  assert.equal(body.service.source, "self");
  assert.match(body.service.description, /metrics aggregation/i);
});


test("agent registry returns versioned draft definitions with execution disabled", async () => {
  const response = await call("/api/v1/agents");
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.count, 3);
  assert.deepEqual(body.agents.map((agent) => agent.id), [
    "ocodejs-builder", "ocodejs-reviewer", "ocodejs-docs"
  ]);
  for (const agent of body.agents) {
    assert.equal(agent.version, "0.1.0");
    assert.equal(agent.status, "draft");
    assert.equal(agent.provider.state, "not_configured");
    assert.equal(agent.executionEnabled, false);
    assert.equal(agent.approvalRequired, true);
    assert.deepEqual(agent.tools, []);
  }
});

test("single agent lookup returns a versioned definition", async () => {
  const response = await call("/api/v1/agents/ocodejs-builder");
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.agent.id, "ocodejs-builder");
  assert.equal(body.agent.version, "0.1.0");
  assert.equal(body.agent.executionEnabled, false);
});

test("unknown agent lookup returns the stable 404 envelope", async () => {
  const response = await call("/api/v1/agents/does-not-exist");
  const body = await response.json();
  assert.equal(response.status, 404);
  assert.equal(body.error.code, "NOT_FOUND");
});


test("MCP connection registry reports only the fixed staging endpoint and validates handshake", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (_url, init = {}) => {
    calls += 1;
    const payload = JSON.parse(init.body || "{}");
    if (payload.method === "initialize") {
      return Response.json({
        jsonrpc: "2.0",
        id: payload.id,
        result: {
          protocolVersion: "2025-03-26",
          serverInfo: { name: "ocodejs-control-center", version: "1.0.0" },
          capabilities: {}
        }
      });
    }
    if (payload.method === "notifications/initialized") {
      return new Response(null, { status: 202 });
    }
    if (payload.method === "tools/list") {
      return Response.json({
        jsonrpc: "2.0",
        id: payload.id,
        result: {
          tools: [
            { name: "get_control_api_health", description: "Read health" },
            { name: "list_services", description: "List services" }
          ]
        }
      });
    }
    return new Response("unexpected", { status: 400 });
  };
  try {
    const response = await call("/api/v1/mcp/connections");
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.count, 1);
    assert.equal(calls, 3);
    assert.equal(body.connections[0].id, "ocodejs-mcp-staging");
    assert.equal(body.connections[0].state, "healthy");
    assert.equal(body.connections[0].toolCount, 2);
    assert.equal(body.connections[0].access, "read_only");
    assert.equal(body.connections[0].managed, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("unknown MCP connection lookup returns a stable 404 envelope", async () => {
  const response = await call("/api/v1/mcp/connections/not-registered");
  const body = await response.json();
  assert.equal(response.status, 404);
  assert.equal(body.error.code, "NOT_FOUND");
});


test("single MCP connection lookup returns fixed staging metadata and health", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, init = {}) => {
    const payload = JSON.parse(init.body || "{}");
    if (payload.method === "initialize") {
      return Response.json({
        jsonrpc: "2.0",
        id: payload.id,
        result: {
          protocolVersion: "2025-03-26",
          serverInfo: { name: "ocodejs-control-center", version: "1.0.0" },
          capabilities: {}
        }
      });
    }
    if (payload.method === "notifications/initialized") {
      return new Response(null, { status: 202 });
    }
    if (payload.method === "tools/list") {
      return Response.json({
        jsonrpc: "2.0",
        id: payload.id,
        result: {
          tools: [
            { name: "get_control_api_health", description: "Read health" },
            { name: "list_services", description: "List services" }
          ]
        }
      });
    }
    return new Response("unexpected", { status: 400 });
  };
  try {
    const response = await call("/api/v1/mcp/connections/ocodejs-mcp-staging");
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.connection.id, "ocodejs-mcp-staging");
    assert.equal(body.connection.environment, "staging");
    assert.equal(body.connection.state, "healthy");
    assert.equal(body.connection.toolCount, 2);
    assert.equal(body.connection.managed, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
