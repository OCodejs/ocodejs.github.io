import assert from "node:assert/strict";

const endpoint = "https://ocodejs-mcp-staging.huynhthuongg2505-f9b.workers.dev/mcp";
const protocolVersion = "2025-03-26";
const expectedTools = [
  "get_control_api_health",
  "get_provider_definition",
  "get_agent_definition",
  "list_agents",
  "list_providers",
  "list_services"
].sort();

async function rpc(message) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      "mcp-protocol-version": protocolVersion
    },
    body: JSON.stringify(message),
    signal: AbortSignal.timeout(12000)
  });
  const text = await response.text();
  assert.equal(response.status, message.method === "notifications/initialized" ? 202 : 200,
    `${message.method}: unexpected HTTP status ${response.status}: ${text.slice(0, 300)}`);
  if (message.method === "notifications/initialized") return null;
  assert.match(response.headers.get("content-type") || "", /application\/json/i,
    `${message.method}: expected JSON response`);
  let data;
  try { data = JSON.parse(text); }
  catch { throw new Error(`${message.method}: response was not valid JSON`); }
  assert.equal(data.jsonrpc, "2.0");
  assert.equal(data.id, message.id);
  assert.equal(data.error, undefined, `${message.method}: ${JSON.stringify(data.error)}`);
  return data.result;
}

const initialized = await rpc({
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion,
    capabilities: {},
    clientInfo: { name: "ocodejs-staging-smoke", version: "1.0.0" }
  }
});
assert.equal(initialized.protocolVersion, protocolVersion);
assert.equal(initialized.serverInfo?.name, "ocodejs-control-center");

await rpc({ jsonrpc: "2.0", method: "notifications/initialized" });

const listed = await rpc({ jsonrpc: "2.0", id: 2, method: "tools/list" });
const actualTools = (listed.tools || []).map((tool) => tool.name).sort();
assert.deepEqual(actualTools, expectedTools,
  "MCP endpoint must expose exactly the six approved read-only tools");
assert.ok((listed.tools || []).every((tool) => tool.inputSchema?.additionalProperties === false),
  "Every MCP tool must reject undeclared arguments");

console.log(JSON.stringify({
  ok: true,
  endpoint,
  protocolVersion,
  server: initialized.serverInfo,
  toolCount: actualTools.length,
  tools: actualTools,
  toolCallsExecuted: 0
}, null, 2));
