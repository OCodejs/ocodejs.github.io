const API_BASE = "https://ocodejs-server-api-staging.huynhthuongg2505-f9b.workers.dev/api/v1";
const AUTH_HEALTH = "https://auth.ocodejs.dev/health";
const ORIGIN = "https://ocodejs.co";

async function getJson(url, headers = {}) {
  const response = await fetch(url, {
    method: "GET",
    redirect: "follow",
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
    headers: { accept: "application/json", ...headers }
  });
  const body = await response.json().catch(() => null);
  return { response, body };
}

const [auth, services] = await Promise.all([
  getJson(AUTH_HEALTH),
  getJson(API_BASE + "/services", { origin: ORIGIN })
]);

const states = Object.fromEntries((services.body?.services || []).map((service) => [service.id, service.state]));
const result = {
  auth: {
    status: auth.response.status,
    ok: auth.response.status === 200 && auth.body?.ok === true && auth.body?.service === "ocodejs-auth-worker",
    patConfigured: auth.body?.patConfigured === true,
    oauthConfigured: auth.body?.oauthConfigured === true
  },
  controlApi: {
    status: services.response.status,
    ok: services.response.status === 200 && Array.isArray(services.body?.services),
    corsOrigin: services.response.headers.get("access-control-allow-origin"),
    corsOk: services.response.headers.get("access-control-allow-origin") === ORIGIN,
    serviceStates: states
  },
  loginFlow: "not_executed_no_user_session_or_oauth_authorization"
};
console.log(JSON.stringify(result, null, 2));
if (!result.auth.ok || !result.auth.patConfigured || !result.auth.oauthConfigured ||
    !result.controlApi.ok || !result.controlApi.corsOk ||
    states["cli-auth"] !== "healthy" || states["mcp-server"] !== "healthy") {
  process.exitCode = 1;
}
