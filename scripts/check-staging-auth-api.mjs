const API_BASE = "https://ocodejs-server-api-staging.huynhthuongg2505-f9b.workers.dev/api/v1";
const AUTH_CUSTOM = "https://auth.ocodejs.dev/health";
const AUTH_WORKERS = "https://mcp-auth-ocodejs.ocodejs-df1.workers.dev/health";
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

const [authCustom, authWorker, services] = await Promise.all([
  getJson(AUTH_CUSTOM),
  getJson(AUTH_WORKERS),
  getJson(API_BASE + "/services", { origin: ORIGIN })
]);

const states = Object.fromEntries((services.body?.services || []).map((service) => [service.id, service.state]));
const result = {
  authCustomDomain: {
    status: authCustom.response.status,
    cfMitigated: authCustom.response.headers.get("cf-mitigated"),
    service: authCustom.body?.service || null
  },
  authWorkersDev: {
    status: authWorker.response.status,
    ok: authWorker.response.status === 200 && authWorker.body?.ok === true && authWorker.body?.service === "ocodejs-auth-worker",
    patConfigured: authWorker.body?.patConfigured === true,
    oauthConfigured: authWorker.body?.oauthConfigured === true
  },
  controlApi: {
    status: services.response.status,
    ok: services.response.status === 200 && Array.isArray(services.body?.services),
    corsOrigin: services.response.headers.get("access-control-allow-origin"),
    corsOk: services.response.headers.get("access-control-allow-origin") === ORIGIN,
    serviceStates: states,
    serviceDescriptions: Object.fromEntries((services.body?.services || []).map((service) => [service.id, service.description]))
  },
  loginFlow: "not_executed_no_user_session_or_oauth_authorization"
};
console.log(JSON.stringify(result, null, 2));
if (!result.authWorkersDev.ok || !result.authWorkersDev.patConfigured || !result.authWorkersDev.oauthConfigured ||
    !result.controlApi.ok || !result.controlApi.corsOk) {
  process.exitCode = 1;
}
