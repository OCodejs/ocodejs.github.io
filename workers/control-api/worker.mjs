import { writeRequestMetric } from "./telemetry.mjs";

const API_PREFIX = "/api/v1";
const API_VERSION = "1.7.0";
const CLI_AUTH_HEALTH_URL = "https://auth.ocodejs.dev/health";
const MCP_ENDPOINT = "https://ocodejs-mcp-staging.huynhthuongg2505-f9b.workers.dev/mcp";
const DEFAULT_ALLOWED_ORIGINS = ["https://ocodejs.github.io"];

const AGENTS = [
  {
    id: "ocodejs-builder",
    name: "OCode.js Builder",
    version: "0.1.0",
    status: "draft",
    description: "Draft agent definition for prompt-to-code generation and preview builds.",
    provider: { id: null, state: "not_configured" },
    capabilities: ["prompt_to_code", "preview_build"],
    tools: [],
    executionEnabled: false,
    approvalRequired: true
  },
  {
    id: "ocodejs-reviewer",
    name: "OCode.js Reviewer",
    version: "0.1.0",
    status: "draft",
    description: "Draft agent definition for source-code review and change-risk summaries.",
    provider: { id: null, state: "not_configured" },
    capabilities: ["code_review", "risk_summary"],
    tools: [],
    executionEnabled: false,
    approvalRequired: true
  },
  {
    id: "ocodejs-docs",
    name: "OCode.js Docs Agent",
    version: "0.1.0",
    status: "draft",
    description: "Draft agent definition for generating and maintaining project documentation.",
    provider: { id: null, state: "not_configured" },
    capabilities: ["documentation", "api_reference"],
    tools: [],
    executionEnabled: false,
    approvalRequired: true
  }
];

const PROVIDERS = [
  {
    id: "cloudflare-workers-ai",
    name: "Cloudflare Workers AI",
    kind: "managed_inference",
    state: "not_configured",
    description: "Provider adapter is catalogued but no AI binding or explicit runtime enable flag is configured in staging.",
    capabilities: ["text_generation"],
    executionEnabled: false,
    requiresExplicitEnablement: true
  }
];

const MCP_CONNECTIONS = [
  {
    id: "ocodejs-mcp-staging",
    name: "OCode.js MCP Staging",
    endpoint: MCP_ENDPOINT,
    transport: "streamable-http",
    environment: "staging",
    access: "read_only",
    managed: false
  }
];

const SERVICES = [
  {
    id: "control-api",
    name: "OCodeJS Control API",
    description: "Read-only health and service registry API",
    state: "healthy",
    source: "self"
  },
  {
    id: "identity",
    name: "Identity & Authentication",
    description: "OCodeJS Account Portal Auth.js backend is not deployed; tracked separately from CLI OAuth.",
    state: "not_configured",
    source: "unverified"
  },
  {
    id: "cli-auth",
    name: "OCodeJS CLI GitHub Auth",
    description: "GitHub OAuth/PAT session service health probe",
    state: "unknown",
    source: "remote_probe"
  },
  {
    id: "mcp-server",
    name: "OCodeJS MCP Server",
    description: "Staging MCP protocol handshake and read-only tool discovery",
    state: "unknown",
    source: "remote_probe"
  },
  {
    id: "ai-runtime",
    name: "AI Agent Runtime",
    description: "No agent runtime health adapter is configured",
    state: "not_configured",
    source: "unverified"
  },
  {
    id: "mcp-manager",
    name: "MCP Connection Manager",
    description: "No MCP connection health adapter is configured",
    state: "not_configured",
    source: "unverified"
  },
  {
    id: "telemetry",
    name: "Developer Telemetry",
    description: "Structured request events are emitted to Workers Logs; metrics aggregation and a queryable audit store are not configured.",
    state: "degraded",
    source: "self"
  }
];

function requestId(request) {
  const supplied = request.headers.get("x-request-id") || "";
  return /^[a-zA-Z0-9._-]{8,80}$/.test(supplied)
    ? supplied
    : crypto.randomUUID();
}

function corsHeaders(request, env) {
  const headers = new Headers({
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Request-Id",
    "Access-Control-Max-Age": "600"
  });

  const origin = request.headers.get("Origin");
  const allowed = [...DEFAULT_ALLOWED_ORIGINS, ...String(env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)];

  if (origin && allowed.includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
  }

  return headers;
}

function json(data, status, headers) {
  const output = new Headers(headers);
  output.set("Content-Type", "application/json; charset=utf-8");
  output.set("Cache-Control", "no-store");
  output.set("X-Content-Type-Options", "nosniff");
  output.set("Referrer-Policy", "no-referrer");
  return new Response(JSON.stringify(data), { status, headers: output });
}

function errorResponse(code, message, status, id, headers) {
  return json({
    error: { code, message, details: null },
    requestId: id
  }, status, headers);
}

async function probeCliAuth() {
  const startedAt = Date.now();
  const checkedAt = new Date().toISOString();
  try {
    const response = await fetch(CLI_AUTH_HEALTH_URL, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(4000)
    });
    if (!response.ok) {
      return {
        state: "unavailable",
        description: "CLI Auth health endpoint returned HTTP " + response.status + ".",
        checkedAt,
        latencyMs: Date.now() - startedAt
      };
    }
    const payload = await response.json();
    if (payload.ok !== true || payload.service !== "ocodejs-auth-worker") {
      return {
        state: "unknown",
        description: "CLI Auth health response did not match the expected service contract.",
        checkedAt,
        latencyMs: Date.now() - startedAt
      };
    }
    const configured = payload.patConfigured === true && payload.oauthConfigured === true;
    return {
      state: configured ? "healthy" : "degraded",
      description: configured
        ? "Health endpoint responds and required GitHub OAuth/PAT bindings are present; end-to-end login is not verified."
        : "Health endpoint responds, but one or more GitHub OAuth/PAT bindings are missing.",
      checkedAt,
      latencyMs: Date.now() - startedAt
    };
  } catch {
    return {
      state: "unavailable",
      description: "CLI Auth health endpoint could not be reached.",
      checkedAt,
      latencyMs: Date.now() - startedAt
    };
  }
}

async function probeMcpServer() {
  const startedAt = Date.now();
  const checkedAt = new Date().toISOString();
  try {
    const initializeResponse = await fetch(MCP_ENDPOINT, {
      method: "POST",
      headers: { Accept: "application/json, text/event-stream", "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-03-26",
          capabilities: {},
          clientInfo: { name: "ocodejs-control-api-probe", version: "1.0.0" }
        }
      }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(4000)
    });
    if (!initializeResponse.ok) {
      return { state: "unavailable", description: "MCP initialize returned HTTP " + initializeResponse.status + ".", checkedAt, latencyMs: Date.now() - startedAt };
    }
    const initialized = await initializeResponse.json();
    if (initialized?.result?.protocolVersion !== "2025-03-26" || initialized?.result?.serverInfo?.name !== "ocodejs-control-center") {
      return { state: "unknown", description: "MCP initialize response did not match the expected protocol contract.", checkedAt, latencyMs: Date.now() - startedAt };
    }

    const notificationResponse = await fetch(MCP_ENDPOINT, {
      method: "POST",
      headers: { Accept: "application/json, text/event-stream", "Content-Type": "application/json", "MCP-Protocol-Version": "2025-03-26" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(4000)
    });
    if (notificationResponse.status !== 202) {
      return { state: "unknown", description: "MCP initialized notification was not accepted.", checkedAt, latencyMs: Date.now() - startedAt };
    }

    const toolsResponse = await fetch(MCP_ENDPOINT, {
      method: "POST",
      headers: { Accept: "application/json, text/event-stream", "Content-Type": "application/json", "MCP-Protocol-Version": "2025-03-26" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list" }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(4000)
    });
    if (!toolsResponse.ok) {
      return { state: "unavailable", description: "MCP tools/list returned HTTP " + toolsResponse.status + ".", checkedAt, latencyMs: Date.now() - startedAt };
    }
    const listed = await toolsResponse.json();
    const toolNames = (listed?.result?.tools || []).map((tool) => tool.name).sort();
    if (JSON.stringify(toolNames) !== JSON.stringify(["get_agent_definition", "get_control_api_health", "get_provider_definition", "list_agents", "list_providers", "list_services"])) {
      return { state: "unknown", description: "MCP tools/list did not return the expected read-only tool allowlist.", checkedAt, latencyMs: Date.now() - startedAt };
    }
    return {
      state: "healthy",
      description: "MCP initialize and tools/list passed; six read-only tools discovered. Tool execution is not part of this probe.",
      checkedAt,
      latencyMs: Date.now() - startedAt,
      toolCount: toolNames.length
    };
  } catch {
    return {
      state: "unavailable",
      description: "MCP staging endpoint could not complete the protocol handshake.",
      checkedAt,
      latencyMs: Date.now() - startedAt
    };
  }
}

async function serviceSnapshot(service, checkedAt) {
  if (service.id === "cli-auth") {
    return { ...service, ...(await probeCliAuth()) };
  }
  if (service.id === "mcp-server") {
    return { ...service, ...(await probeMcpServer()) };
  }
  return {
    ...service,
    checkedAt: service.source === "self" ? checkedAt : null,
    latencyMs: null
  };
}

async function handleRequest(request, env, url, headers, id) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    if (request.method !== "GET") {
      headers.set("Allow", "GET, OPTIONS");
      return errorResponse(
        "METHOD_NOT_ALLOWED",
        "This endpoint supports GET requests only.",
        405,
        id,
        headers
      );
    }

    if (url.pathname === API_PREFIX) {
      return json({
        name: "OCodeJS Control API",
        version: API_VERSION,
        status: "preview",
        routes: [
          "GET /api/v1/health/live",
          "GET /api/v1/health/ready",
          "GET /api/v1/runtime/status",
          "GET /api/v1/services",
          "GET /api/v1/services/{serviceId}",
          "GET /api/v1/providers",
          "GET /api/v1/providers/{providerId}",
          "GET /api/v1/agents",
          "GET /api/v1/agents/{agentId}",
          "GET /api/v1/mcp/connections",
          "GET /api/v1/mcp/connections/{connectionId}"
        ],
        requestId: id
      }, 200, headers);
    }

    if (url.pathname === `${API_PREFIX}/health/live`) {
      return json({
        service: "control-api",
        state: "healthy",
        live: true,
        checkedAt: new Date().toISOString(),
        version: API_VERSION,
        requestId: id
      }, 200, headers);
    }

    if (url.pathname === `${API_PREFIX}/health/ready`) {
      return json({
        service: "control-api",
        state: "ready",
        ready: true,
        checkedAt: new Date().toISOString(),
        dependencies: [],
        note: "The API is stateless in this phase; downstream service adapters are not configured.",
        requestId: id
      }, 200, headers);
    }
    if (url.pathname === `${API_PREFIX}/runtime/status`) {
      return json({
        runtime: {
          state: "not_configured",
          provider: { id: null, state: "not_configured" },
          cataloguedProviders: PROVIDERS.map((provider) => provider.id),
          configuredProviders: [],
          runStore: { state: "not_configured" },
          executionEnabled: false,
          inferenceEnabled: false,
          runLifecycle: "disabled",
          approvalRequired: true,
          reason: "No server-side provider binding or isolated run store is configured."
        },
        checkedAt: new Date().toISOString(),
        requestId: id
      }, 200, headers);
    }


    if (url.pathname === `${API_PREFIX}/services`) {
      const checkedAt = new Date().toISOString();
      const services = await Promise.all(SERVICES.map((service) => serviceSnapshot(service, checkedAt)));
      return json({
        services,
        count: services.length,
        checkedAt,
        requestId: id
      }, 200, headers);
    }

    const serviceMatch = url.pathname.match(
      new RegExp(`^${API_PREFIX}/services/([a-z0-9-]+)$`)
    );

    if (serviceMatch) {
      const service = SERVICES.find((item) => item.id === serviceMatch[1]);
      if (!service) {
        return errorResponse(
          "NOT_FOUND",
          "The requested service is not registered.",
          404,
          id,
          headers
        );
      }

      return json({
        service: await serviceSnapshot(service, new Date().toISOString()),
        requestId: id
      }, 200, headers);
    }

    if (url.pathname === API_PREFIX + "/providers") {
      const providers = PROVIDERS.map((provider) => ({
        ...provider,
        capabilities: [...provider.capabilities]
      }));
      return json({
        providers,
        count: providers.length,
        checkedAt: new Date().toISOString(),
        requestId: id
      }, 200, headers);
    }

    const providerMatch = url.pathname.match(/^\/api\/v1\/providers\/([a-z0-9-]+)$/);
    if (providerMatch) {
      const provider = PROVIDERS.find((item) => item.id === providerMatch[1]);
      if (!provider) {
        return errorResponse(
          "NOT_FOUND",
          "The requested provider is not registered.",
          404,
          id,
          headers
        );
      }
      return json({
        provider: { ...provider, capabilities: [...provider.capabilities] },
        requestId: id
      }, 200, headers);
    }

    if (url.pathname === API_PREFIX + "/agents") {
      const agents = AGENTS.map((agent) => ({
        ...agent,
        provider: { ...agent.provider },
        capabilities: [...agent.capabilities],
        tools: [...agent.tools]
      }));
      return json({
        agents,
        count: agents.length,
        checkedAt: new Date().toISOString(),
        requestId: id
      }, 200, headers);
    }

    const agentMatch = url.pathname.match(/^\/api\/v1\/agents\/([a-z0-9-]+)$/);
    if (agentMatch) {
      const agent = AGENTS.find((item) => item.id === agentMatch[1]);
      if (!agent) {
        return errorResponse(
          "NOT_FOUND",
          "The requested agent is not registered.",
          404,
          id,
          headers
        );
      }
      return json({
        agent: {
          ...agent,
          provider: { ...agent.provider },
          capabilities: [...agent.capabilities],
          tools: [...agent.tools]
        },
        requestId: id
      }, 200, headers);
    }

    if (url.pathname === API_PREFIX + "/mcp/connections") {
      const health = await probeMcpServer();
      const connections = MCP_CONNECTIONS.map((connection) => ({
        ...connection,
        ...health
      }));
      return json({
        connections,
        count: connections.length,
        checkedAt: new Date().toISOString(),
        requestId: id
      }, 200, headers);
    }

    const mcpConnectionMatch = url.pathname.match(/^\/api\/v1\/mcp\/connections\/([a-z0-9-]+)$/);
    if (mcpConnectionMatch) {
      const connection = MCP_CONNECTIONS.find((item) => item.id === mcpConnectionMatch[1]);
      if (!connection) {
        return errorResponse(
          "NOT_FOUND",
          "The requested MCP connection is not registered.",
          404,
          id,
          headers
        );
      }
      const health = await probeMcpServer();
      return json({
        connection: { ...connection, ...health },
        requestId: id
      }, 200, headers);
    }

    return errorResponse(
      "NOT_FOUND",
      "The requested API route does not exist.",
      404,
      id,
      headers
    );
}

function logRequest(response, request, url, id, startedAt, env) {
  const durationMs = Math.max(0, Date.now() - startedAt);
  response.headers.set("X-Request-Id", id);
  response.headers.set("Server-Timing", `app;dur=${durationMs}`);
  const telemetryEvent = {
    event: "control_api.request",
    requestId: id,
    method: request.method,
    path: url.pathname,
    status: response.status,
    durationMs,
    timestamp: new Date().toISOString()
  };
  console.log(JSON.stringify({
    event: "control_api.request",
    requestId: id,
    method: request.method,
    path: url.pathname,
    status: response.status,
    durationMs,
    timestamp: telemetryEvent.timestamp
  }));
  try {
    writeRequestMetric(env.OBSERVABILITY, {
      method: request.method,
      routeClass: url.pathname.startsWith(`${API_PREFIX}/services`) ? "services"
        : url.pathname.startsWith(`${API_PREFIX}/agents`) ? "agents"
        : url.pathname.startsWith(`${API_PREFIX}/providers`) ? "providers"
        : url.pathname.startsWith(`${API_PREFIX}/mcp`) ? "mcp"
        : url.pathname.startsWith(`${API_PREFIX}/health`) ? "health"
        : url.pathname.startsWith(`${API_PREFIX}/runtime`) ? "runtime" : "other",
      status: response.status,
      requestId: id,
      path: url.pathname,
      durationMs
    });
  } catch (error) {
    console.warn(JSON.stringify({ event: "control_api.telemetry_write_failed", requestId: id, errorType: error?.name || "Error" }));
  }
  return response;
}

export default {
  async fetch(request, env = {}) {
    const startedAt = Date.now();
    const url = new URL(request.url);
    const headers = corsHeaders(request, env);
    const id = requestId(request);
    let response;
    try {
      response = await handleRequest(request, env, url, headers, id);
    } catch {
      response = errorResponse(
        "INTERNAL_ERROR",
        "The API could not complete the request.",
        500,
        id,
        headers
      );
    }
    return logRequest(response, request, url, id, startedAt, env);
  }
};
