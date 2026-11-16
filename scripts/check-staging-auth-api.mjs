// Verify Auth service binding after enabling redirect-follow.
// Recheck Auth binding with canonical host preservation and error type reporting.
// Verify both internal Auth and MCP bindings after staging deployment.
// Post-deployment check after adding the internal MCP service binding.
// Recheck after deploying the diagnostic MCP probe revision.
// Post-deployment diagnostic for Auth, Control API, and MCP redirect behavior.
const API_BASE = "https://ocodejs-server-api-staging.huynhthuongg2505-f9b.workers.dev/api/v1";
const AUTH_CUSTOM = "https://auth.ocodejs.dev/health";
const MCP_ENDPOINT = "https://ocodejs-mcp-staging.huynhthuongg2505-f9b.workers.dev/mcp";
const ORIGIN = "https://ocodejs.co";

async function getResponse(url, headers = {}) {
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
      headers: { accept: "application/json", ...headers }
    });
    const raw = await response.text();
    let body = null;
    try { body = JSON.parse(raw); } catch {}
    return { response, raw, body, error: null };
  } catch (error) {
    return { response: null, raw: "", body: null, error: error?.cause?.code || error?.message || "fetch failed" };
  }
}

async function inspectMcpRedirect() {
  try {
    const response = await fetch(MCP_ENDPOINT, {
      method: "POST",
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
      headers: { accept: "application/json, text/event-stream", "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "diagnostic", version: "1.0.0" } }
      })
    });
    const raw = await response.text();
    return {
      status: response.status,
      location: response.headers.get("location"),
      contentType: response.headers.get("content-type"),
      bodyPreview: raw.slice(0, 200)
    };
  } catch (error) {
    return { error: error?.cause?.code || error?.message || "fetch failed" };
  }
}

const [auth, services, mcpService, mcpManual] = await Promise.all([
  getResponse(AUTH_CUSTOM),
  getResponse(API_BASE + "/services", { origin: ORIGIN }),
  getResponse(API_BASE + "/services/mcp-server", { origin: ORIGIN }),
  inspectMcpRedirect()
]);

const states = Object.fromEntries((services.body?.services || []).map((service) => [service.id, service.state]));
const descriptions = Object.fromEntries((services.body?.services || []).map((service) => [service.id, service.description]));
const result = {
  authCustomDomain: {
    status: auth.response?.status ?? null,
    cfMitigated: auth.response?.headers.get("cf-mitigated") ?? null,
    server: auth.response?.headers.get("server") ?? null,
    contentType: auth.response?.headers.get("content-type") ?? null,
    bodyPreview: auth.raw.slice(0, 180),
    error: auth.error
  },
  controlApi: {
    status: services.response?.status ?? null,
    corsOrigin: services.response?.headers.get("access-control-allow-origin") ?? null,
    corsOk: services.response?.headers.get("access-control-allow-origin") === ORIGIN,
    serviceStates: states,
    serviceDescriptions: descriptions,
    error: services.error
  },
  mcpManualRedirectCheck: mcpManual,
  mcpProbe: {
    status: mcpService.response?.status ?? null,
    service: mcpService.body?.service ?? null,
    state: mcpService.body?.service?.state ?? null,
    description: mcpService.body?.service?.description ?? null,
    error: mcpService.error
  },
  loginFlow: "not_executed_no_user_session_or_oauth_authorization"
};
console.log(JSON.stringify(result, null, 2));
if (!services.response || services.response.status !== 200 || !result.controlApi.corsOk) {
  process.exitCode = 1;
}
