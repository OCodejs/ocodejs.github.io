const CONTROL_API = "https://ocodejs-server-api-staging.huynhthuongg2505-f9b.workers.dev";
const PROTOCOL_VERSION = "2025-03-26";
const MAX_BODY_BYTES = 64 * 1024;

const TOOLS = [
  {
    name: "get_control_api_health",
    description: "Read liveness and readiness from the OCode.js staging Control API. This tool is read-only.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false }
  },
  {
    name: "list_services",
    description: "List registered OCode.js staging services and their reported states. This tool is read-only.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false }
  },
  {
    name: "list_agents",
    description: "List versioned OCode.js agent definitions. Draft agents cannot execute. This tool is read-only.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false }
  },
  {
    name: "get_agent_definition",
    description: "Read one versioned OCode.js agent definition by ID. This tool is read-only.",
    inputSchema: {
      type: "object",
      properties: { agentId: { type: "string", pattern: "^[a-z0-9-]+$" } },
      required: ["agentId"],
      additionalProperties: false
    }
  },
  {
    name: "list_providers",
    description: "List catalogued AI provider adapters and their configuration states. This tool never invokes inference.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false }
  },
  {
    name: "get_provider_definition",
    description: "Read one catalogued AI provider adapter by ID. This tool never invokes inference.",
    inputSchema: {
      type: "object",
      properties: { providerId: { type: "string", pattern: "^[a-z0-9-]+$" } },
      required: ["providerId"],
      additionalProperties: false
    }
  }
];

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, GET, OPTIONS",
      "access-control-allow-headers": "content-type, accept, mcp-session-id, mcp-protocol-version",
      "access-control-expose-headers": "Mcp-Session-Id, Mcp-Protocol-Version",
      ...extra
    }
  });
}

function rpcError(id, code, message) {
  return json({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });
}

function toolResult(value, isError = false) {
  return {
    content: [{ type: "text", text: JSON.stringify(value) }],
    structuredContent: value,
    ...(isError ? { isError: true } : {})
  };
}

async function getJson(path) {
  const response = await fetch(CONTROL_API + path, {
    method: "GET",
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(8000)
  });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); }
  catch { throw new Error("Control API returned invalid JSON"); }
  if (!response.ok) {
    const error = new Error("Control API request failed");
    error.status = response.status;
    throw error;
  }
  return data;
}

async function callTool(name, args) {
  if (!args || typeof args !== "object" || Array.isArray(args)) {
    throw new TypeError("Tool arguments must be an object");
  }
  if (name === "get_control_api_health" || name === "list_services" || name === "list_agents" || name === "list_providers") {
    if (Object.keys(args).length) throw new TypeError("This read-only tool accepts an empty arguments object");
  }
  if (name === "get_agent_definition") {
    if (Object.keys(args).length !== 1 || typeof args.agentId !== "string" || !/^[a-z0-9-]+$/.test(args.agentId)) {
      throw new TypeError("agentId must match ^[a-z0-9-]+$ and no extra arguments are allowed");
    }
    return await getJson("/api/v1/agents/" + encodeURIComponent(args.agentId));
  }
  if (name === "get_provider_definition") {
    if (Object.keys(args).length !== 1 || typeof args.providerId !== "string" || !/^[a-z0-9-]+$/.test(args.providerId)) {
      throw new TypeError("providerId must match ^[a-z0-9-]+$ and no extra arguments are allowed");
    }
    return await getJson("/api/v1/providers/" + encodeURIComponent(args.providerId));
  }
  if (name === "list_providers") {
    return await getJson("/api/v1/providers");
  }
  if (name === "list_agents") {
    return await getJson("/api/v1/agents");
  }
  if (name === "get_control_api_health") {
    const [live, ready] = await Promise.all([
      getJson("/api/v1/health/live"),
      getJson("/api/v1/health/ready")
    ]);
    return { live, ready, checkedAt: new Date().toISOString() };
  }
  if (name === "list_services") {
    return await getJson("/api/v1/services");
  }
  const error = new Error("Unknown tool");
  error.code = -32602;
  throw error;
}

async function handleRpc(message) {
  if (!message || typeof message !== "object" || Array.isArray(message) || message.jsonrpc !== "2.0" || typeof message.method !== "string") {
    return rpcError(message?.id, -32600, "Invalid JSON-RPC request");
  }
  const id = Object.prototype.hasOwnProperty.call(message, "id") ? message.id : undefined;
  if (id === undefined) {
    if (message.method === "notifications/initialized" || message.method.startsWith("notifications/")) {
      return new Response(null, { status: 202, headers: corsHeaders() });
    }
    return new Response(null, { status: 202, headers: corsHeaders() });
  }
  if (message.method === "initialize") {
    return json({
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "ocodejs-control-center", version: "1.1.0" },
        instructions: "Read-only access to OCode.js staging health, services, versioned agent definitions and AI provider catalog. Agent execution and model inference are disabled."
      }
    });
  }
  if (message.method === "ping") {
    return json({ jsonrpc: "2.0", id, result: {} });
  }
  if (message.method === "tools/list") {
    return json({ jsonrpc: "2.0", id, result: { tools: TOOLS } });
  }
  if (message.method === "tools/call") {
    const params = message.params || {};
    if (typeof params.name !== "string") return rpcError(id, -32602, "Tool name is required");
    try {
      const result = await callTool(params.name, params.arguments ?? {});
      return json({ jsonrpc: "2.0", id, result: toolResult(result) });
    } catch (error) {
      const code = error.code ?? -32000;
      return json({ jsonrpc: "2.0", id, result: toolResult({ error: error.message, status: error.status ?? null }, true) });
    }
  }
  return rpcError(id, -32601, "Method not found");
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST, GET, OPTIONS",
    "access-control-allow-headers": "content-type, accept, mcp-session-id, mcp-protocol-version",
    "cache-control": "no-store"
  };
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname !== "/mcp" && url.pathname !== "/") return json({ error: "Not found" }, 404);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders() });
    if (request.method !== "POST") return json({ error: "Use POST /mcp for Streamable HTTP JSON-RPC" }, 405, { allow: "POST, OPTIONS" });
    const length = Number(request.headers.get("content-length") || 0);
    if (length > MAX_BODY_BYTES) return json({ error: "Request body too large" }, 413);
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return json({ error: "Request body too large" }, 413);
    let message;
    try { message = JSON.parse(raw); }
    catch { return rpcError(null, -32700, "Parse error"); }
    if (Array.isArray(message)) return rpcError(null, -32600, "Batch requests are not supported");
    if (message?.method !== "initialize" && request.headers.get("mcp-protocol-version") !== PROTOCOL_VERSION) {
      return json({ error: "Missing or unsupported MCP-Protocol-Version header" }, 400);
    }
    return handleRpc(message);
  }
};
