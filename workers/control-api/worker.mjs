const API_PREFIX = "/api/v1";
const API_VERSION = "1.0.1";
const DEFAULT_ALLOWED_ORIGINS = ["https://ocodejs.github.io"];

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
    description: "Authentication integration is not connected to this API",
    state: "not_configured",
    source: "unverified"
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
    description: "No telemetry backend is configured",
    state: "not_configured",
    source: "unverified"
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

export default {
  async fetch(request, env = {}) {
    const url = new URL(request.url);
    const headers = corsHeaders(request, env);
    const id = requestId(request);

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
          "GET /api/v1/services",
          "GET /api/v1/services/{serviceId}"
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

    if (url.pathname === `${API_PREFIX}/services`) {
      const checkedAt = new Date().toISOString();
      return json({
        services: SERVICES.map((service) => ({
          ...service,
          checkedAt: service.source === "self" ? checkedAt : null,
          latencyMs: null
        })),
        count: SERVICES.length,
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
        service: {
          ...service,
          checkedAt: service.source === "self" ? new Date().toISOString() : null,
          latencyMs: null
        },
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
};
