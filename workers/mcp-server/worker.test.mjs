import test from "node:test";
import assert from "node:assert/strict";
import worker from "./worker.mjs";

const request = (body, method = "POST") => new Request("https://mcp-staging.example.workers.dev/mcp", {
  method,
  headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "mcp-protocol-version": "2025-03-26" },
  ...(body === undefined ? {} : { body: JSON.stringify(body) })
});

test("initializes a Streamable HTTP MCP session", async () => {
  const response = await worker.fetch(request({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26" } }));
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.result.protocolVersion, "2025-03-26");
  assert.equal(data.result.serverInfo.name, "ocodejs-control-center");
});

test("lists only the four fixed read-only tools", async () => {
  const response = await worker.fetch(request({ jsonrpc: "2.0", id: 2, method: "tools/list" }));
  const data = await response.json();
  assert.deepEqual(data.result.tools.map(tool => tool.name), ["get_control_api_health", "list_services", "list_agents", "get_agent_definition"]);
});

test("rejects unknown methods", async () => {
  const response = await worker.fetch(request({ jsonrpc: "2.0", id: 3, method: "admin/delete" }));
  const data = await response.json();
  assert.equal(data.error.code, -32601);
});

test("rejects mutating arguments", async () => {
  const response = await worker.fetch(request({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "list_services", arguments: { delete: true } } }));
  const data = await response.json();
  assert.equal(data.result.isError, true);
});

test("answers CORS preflight and rejects non-POST transport", async () => {
  const preflight = await worker.fetch(request(undefined, "OPTIONS"));
  assert.equal(preflight.status, 204);
  const get = await worker.fetch(request(undefined, "GET"));
  assert.equal(get.status, 405);
});

test("returns a JSON-RPC parse error for malformed JSON", async () => {
  const response = await worker.fetch(new Request("https://mcp-staging.example.workers.dev/mcp", { method: "POST", body: "{" }));
  const data = await response.json();
  assert.equal(data.error.code, -32700);
});

test("requires the negotiated protocol version after initialize", async () => {
  const response = await worker.fetch(new Request("https://mcp-staging.example.workers.dev/mcp", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 22, method: "tools/list" })
  }));
  assert.equal(response.status, 400);
  const data = await response.json();
  assert.match(data.error, /MCP-Protocol-Version/);
});


test("list_agents reads the fixed Control API registry", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    assert.equal(url, "https://ocodejs-server-api-staging.huynhthuongg2505-f9b.workers.dev/api/v1/agents");
    assert.equal(init.method, "GET");
    return Response.json({ agents: [{ id: "ocodejs-builder", version: "0.1.0", executionEnabled: false }] });
  };
  try {
    const response = await worker.fetch(request({
      jsonrpc: "2.0", id: 30, method: "tools/call",
      params: { name: "list_agents", arguments: {} }
    }));
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.equal(data.result.structuredContent.agents[0].id, "ocodejs-builder");
    assert.equal(data.result.structuredContent.agents[0].executionEnabled, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("get_agent_definition validates ID and reads one fixed definition", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    assert.equal(url, "https://ocodejs-server-api-staging.huynhthuongg2505-f9b.workers.dev/api/v1/agents/ocodejs-builder");
    assert.equal(init.method, "GET");
    return Response.json({ agent: { id: "ocodejs-builder", version: "0.1.0", executionEnabled: false } });
  };
  try {
    const response = await worker.fetch(request({
      jsonrpc: "2.0", id: 31, method: "tools/call",
      params: { name: "get_agent_definition", arguments: { agentId: "ocodejs-builder" } }
    }));
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.equal(data.result.structuredContent.agent.id, "ocodejs-builder");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("get_agent_definition rejects invalid IDs and extra arguments", async () => {
  const invalidId = await worker.fetch(request({
    jsonrpc: "2.0", id: 32, method: "tools/call",
    params: { name: "get_agent_definition", arguments: { agentId: "../secrets" } }
  }));
  const invalidData = await invalidId.json();
  assert.equal(invalidData.result.isError, true);
  assert.match(invalidData.result.structuredContent.error, /agentId/);
  const extra = await worker.fetch(request({
    jsonrpc: "2.0", id: 33, method: "tools/call",
    params: { name: "list_agents", arguments: { delete: true } }
  }));
  const extraData = await extra.json();
  assert.equal(extraData.result.isError, true);
});
