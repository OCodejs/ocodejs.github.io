const BASE = (process.env.CONTROL_API_BASE || "https://ocodejs-server-api-staging.ocodejs-df1.workers.dev/api/v1").replace(/\/$/, "");
const ORIGIN = "https://ocodejs.co";
const MAX_AGE_MS = 60_000;

async function request(path, init = {}) {
  const response = await fetch(BASE + path, {
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
    ...init
  });
  if (!response.ok) throw new Error(path + " returned HTTP " + response.status);
  return response;
}

function assertFresh(checkedAt, label) {
  const timestamp = Date.parse(checkedAt || "");
  const age = Date.now() - timestamp;
  if (!Number.isFinite(timestamp) || age < -15_000 || age > MAX_AGE_MS) {
    throw new Error(label + " checkedAt is missing, future-dated, or older than 60 seconds");
  }
}

async function main() {
  const live = await (await request("/health/live")).json();
  if (live.live !== true || live.service !== "control-api") throw new Error("Control API liveness contract failed");
  assertFresh(live.checkedAt, "Liveness");

  const ready = await (await request("/health/ready")).json();
  if (ready.ready !== true || ready.service !== "control-api") throw new Error("Control API readiness contract failed");
  assertFresh(ready.checkedAt, "Readiness");

  const registry = await (await request("/services")).json();
  if (!Array.isArray(registry.services)) throw new Error("Service Registry is missing services[]");
  assertFresh(registry.checkedAt, "Service Registry");

  const states = new Set(["healthy", "degraded", "unavailable", "not_configured", "unknown"]);
  for (const service of registry.services) {
    if (!service || typeof service.id !== "string" || typeof service.name !== "string" || !states.has(service.state)) {
      throw new Error("Service Registry contains an invalid service record");
    }
    if (service.state === "healthy" && service.source === "unverified") {
      throw new Error("An unverified service was incorrectly marked healthy: " + service.id);
    }
  }

  const cors = await fetch(BASE + "/health/live", {
    method: "OPTIONS",
    cache: "no-store",
    headers: {
      Origin: ORIGIN,
      "Access-Control-Request-Method": "GET",
      "Access-Control-Request-Headers": "accept"
    },
    signal: AbortSignal.timeout(10_000)
  });
  if (cors.status !== 204 || cors.headers.get("access-control-allow-origin") !== ORIGIN) {
    throw new Error("Control API staging CORS does not allow the exact ocodejs.co origin");
  }

  console.log(JSON.stringify({
    result: "PASS",
    base: BASE,
    checkedAt: registry.checkedAt,
    serviceCount: registry.services.length,
    healthyCount: registry.services.filter(service => service.state === "healthy").length,
    corsOrigin: cors.headers.get("access-control-allow-origin")
  }, null, 2));
}

main().catch((error) => {
  const cause = error?.cause || {};
  const dnsFailure = cause.code === "ENOTFOUND" || cause.code === "EAI_AGAIN";
  console.error(JSON.stringify({
    result: "UNVERIFIED",
    base: BASE,
    hostname: new URL(BASE).hostname,
    reason: dnsFailure ? "DNS resolution failed" : error.message,
    code: cause.code || error.code || "STAGING_CHECK_FAILED",
    action: dnsFailure
      ? "Verify the account workers.dev hostname and external DNS. Do not mark the API healthy or change the frontend endpoint until the public hostname resolves."
      : "Inspect the staging Worker response, health contract, and CORS configuration."
  }, null, 2));
  process.exitCode = 1;
});
