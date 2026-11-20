const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
};

const json = (body, status = 200, extra = {}) =>
  new Response(JSON.stringify(body), { status, headers: { ...JSON_HEADERS, ...extra } });

const textEncoder = new TextEncoder();
const b64url = (value) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

function decodeJsonPart(value) {
  return JSON.parse(new TextDecoder().decode(b64url(value)));
}

let jwksCache = { expiresAt: 0, keys: [] };

async function getGitHubKey(kid) {
  if (Date.now() > jwksCache.expiresAt || !jwksCache.keys.length) {
    const response = await fetch("https://token.actions.githubusercontent.com/.well-known/jwks", {
      headers: { accept: "application/json" },
      cf: { cacheTtl: 300, cacheEverything: true },
    });
    if (!response.ok) throw new Error("GitHub OIDC key discovery failed");
    const data = await response.json();
    jwksCache = { keys: Array.isArray(data.keys) ? data.keys : [], expiresAt: Date.now() + 5 * 60_000 };
  }
  const jwk = jwksCache.keys.find((key) => key.kid === kid && key.kty === "RSA");
  if (!jwk) throw new Error("Unknown GitHub OIDC signing key");
  return crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
}

async function verifyGitHubOidc(token, env) {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Malformed OIDC token");
  const header = decodeJsonPart(parts[0]);
  const claims = decodeJsonPart(parts[1]);
  if (header.alg !== "RS256" || !header.kid) throw new Error("Unsupported OIDC token");
  const key = await getGitHubKey(header.kid);
  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    b64url(parts[2]),
    textEncoder.encode(parts[0] + "." + parts[1]),
  );
  if (!valid) throw new Error("Invalid OIDC signature");
  const now = Math.floor(Date.now() / 1000);
  if (claims.iss !== "https://token.actions.githubusercontent.com") throw new Error("Invalid OIDC issuer");
  if (claims.aud !== "ocodejs-autorun-staging") throw new Error("Invalid OIDC audience");
  if (!Number.isFinite(claims.exp) || claims.exp < now || (claims.nbf && claims.nbf > now + 30)) throw new Error("Expired OIDC token");
  const repository = String(env.ALLOWED_REPOSITORY || "OCodejs/ocodejs.github.io");
  const expectedWorkflow = String(env.ALLOWED_WORKFLOW_REF || "OCodejs/ocodejs.github.io/.github/workflows/autorun-events.yml@refs/heads/main");
  if (claims.repository !== repository) throw new Error("Repository is not allowed");
  if (claims.workflow_ref !== expectedWorkflow) throw new Error("Workflow identity is not allowed");
  if (claims.event_name !== "workflow_run") throw new Error("Only workflow_run events are accepted");
  if (claims.ref !== "refs/heads/main") throw new Error("Bridge must run from the default branch");
  return claims;
}

function corsHeaders(request, env) {
  const origin = request.headers.get("origin") || "";
  const allowed = String(env.ALLOWED_ORIGINS || "https://ocodejs.github.io").split(",").map((item) => item.trim()).filter(Boolean);
  if (!origin || !allowed.includes(origin)) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "authorization, content-type",
    "access-control-max-age": "600",
    vary: "Origin",
  };
}

function normalizeRun(body) {
  const run = body?.workflow_run;
  if (!run || !Number.isSafeInteger(Number(run.id)) || !Number.isSafeInteger(Number(run.run_attempt || 1))) {
    throw new Error("workflow_run payload is invalid");
  }
  const repository = String(run.repository?.full_name || "");
  if (repository !== "OCodejs/ocodejs.github.io") throw new Error("Run repository is not allowed");
  const status = String(run.status || "");
  if (!["queued", "in_progress", "completed"].includes(status)) throw new Error("Run status is invalid");
  const action = String(body.action || "");
  if (!["requested", "in_progress", "completed"].includes(action)) throw new Error("Run event action is invalid");
  return {
    runId: String(run.id),
    attempt: Number(run.run_attempt || 1),
    repository,
    workflowName: String(run.name || "GitHub Actions workflow").slice(0, 180),
    eventName: String(run.event || "unknown").slice(0, 80),
    branch: String(run.head_branch || "").slice(0, 255),
    sha: String(run.head_sha || "").slice(0, 64),
    status,
    conclusion: run.conclusion ? String(run.conclusion).slice(0, 80) : null,
    htmlUrl: String(run.html_url || "").startsWith("https://github.com/") ? String(run.html_url).slice(0, 500) : "",
    createdAt: run.created_at || null,
    startedAt: run.run_started_at || null,
    updatedAt: run.updated_at || new Date().toISOString(),
    action,
  };
}

async function handleEvent(request, env) {
  const auth = request.headers.get("authorization") || "";
  if (!auth.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);
  let claims;
  try {
    claims = await verifyGitHubOidc(auth.slice(7), env);
  } catch (error) {
    return json({ error: "unauthorized", message: error.message }, 401);
  }

  const raw = await request.text();
  if (raw.length > 32_000) return json({ error: "payload_too_large" }, 413);
  let body;
  try { body = JSON.parse(raw); } catch { return json({ error: "invalid_json" }, 400); }
  let run;
  try { run = normalizeRun(body); } catch (error) { return json({ error: "invalid_payload", message: error.message }, 400); }

  const eventId = run.runId + ":" + run.attempt + ":" + run.action;
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO autorun_runs
      (run_id, run_attempt, repository, workflow_name, event_name, branch, head_sha, status, conclusion, html_url, created_at, started_at, updated_at, last_action, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(run_id, run_attempt) DO UPDATE SET
       workflow_name=excluded.workflow_name, event_name=excluded.event_name, branch=excluded.branch,
       head_sha=excluded.head_sha, status=excluded.status, conclusion=excluded.conclusion,
       html_url=excluded.html_url, created_at=excluded.created_at, started_at=excluded.started_at,
       updated_at=excluded.updated_at, last_action=excluded.last_action, synced_at=excluded.synced_at`,
  ).bind(run.runId, run.attempt, run.repository, run.workflowName, run.eventName, run.branch, run.sha, run.status,
    run.conclusion, run.htmlUrl, run.createdAt, run.startedAt, run.updatedAt, run.action, now).run();

  await env.DB.prepare(
    "INSERT OR IGNORE INTO autorun_events (event_id, run_id, run_attempt, action, actor, workflow_ref, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  ).bind(eventId, run.runId, run.attempt, run.action, String(claims.actor || "").slice(0, 100),
    String(claims.workflow_ref || "").slice(0, 500), JSON.stringify({ status: run.status, conclusion: run.conclusion }), now).run();

  return json({ ok: true, runId: run.runId, attempt: run.attempt, status: run.status, syncedAt: now }, 202);
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health/live") return json({ ok: true, service: "ocodejs-autorun-control-staging", storage: "d1" }, 200, cors);
    if (request.method === "GET" && url.pathname === "/api/v1/autorun/summary") {
      const result = await env.DB.prepare(
        "SELECT COUNT(*) AS total, SUM(CASE WHEN status='in_progress' THEN 1 ELSE 0 END) AS running, SUM(CASE WHEN status='queued' THEN 1 ELSE 0 END) AS queued, SUM(CASE WHEN conclusion='success' THEN 1 ELSE 0 END) AS succeeded, SUM(CASE WHEN conclusion IS NOT NULL AND conclusion!='success' THEN 1 ELSE 0 END) AS failed FROM autorun_runs",
      ).first();
      return json({ summary: result || { total: 0, running: 0, queued: 0, succeeded: 0, failed: 0 }, source: "github_actions", checkedAt: new Date().toISOString() }, 200, cors);
    }
    if (request.method === "GET" && url.pathname === "/api/v1/autorun/jobs") {
      const rawLimit = Number(url.searchParams.get("limit") || 50);
      const limit = Math.max(1, Math.min(Number.isFinite(rawLimit) ? Math.floor(rawLimit) : 50, 100));
      const result = await env.DB.prepare(
        "SELECT run_id AS id, run_attempt AS attempt, repository, workflow_name, event_name, branch, head_sha AS sha, status, conclusion, html_url, created_at, started_at, updated_at, synced_at, last_action FROM autorun_runs ORDER BY updated_at DESC LIMIT ?",
      ).bind(limit).all();
      return json({ jobs: result.results || [], count: result.results?.length || 0, source: "github_actions", checkedAt: new Date().toISOString() }, 200, cors);
    }
    if (request.method === "POST" && url.pathname === "/api/v1/autorun/events") {
      const response = await handleEvent(request, env);
      const headers = new Headers(response.headers);
      for (const [key, value] of Object.entries(cors)) headers.set(key, value);
      return new Response(response.body, { status: response.status, headers });
    }
    return json({ error: "not_found" }, 404, cors);
  },
};
