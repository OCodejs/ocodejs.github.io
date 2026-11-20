const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
};

const reply = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: HEADERS });

const nowIso = () => new Date().toISOString();

function equalConstantTime(left, right) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let i = 0; i < left.length; i += 1) mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return mismatch === 0;
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function authorize(request, env) {
  const expected = String(env.AUTORUN_RUNNER_TOKEN_SHA256 || "").trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(expected)) return { ok: false, status: 503, error: "runner_auth_not_configured" };
  const header = request.headers.get("authorization") || "";
  if (!header.startsWith("Bearer ")) return { ok: false, status: 401, error: "unauthorized" };
  const actual = await sha256Hex(header.slice(7));
  return equalConstantTime(actual, expected)
    ? { ok: true }
    : { ok: false, status: 401, error: "unauthorized" };
}

async function readBody(request) {
  const raw = await request.text();
  if (raw.length > 32_000) throw Object.assign(new Error("payload_too_large"), { status: 413 });
  try { return JSON.parse(raw); }
  catch { throw Object.assign(new Error("invalid_json"), { status: 400 }); }
}

function validateJob(body, env) {
  const repo = String(body.repository || "");
  const allowed = String(env.ALLOWED_JOB_REPOSITORIES || "")
    .split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
  if (!allowed.includes(repo.toLowerCase())) throw Object.assign(new Error("repository_not_allowed"), { status: 403 });
  const branch = String(body.branch || "");
  if (!/^[A-Za-z0-9_.\/-]{1,200}$/.test(branch) || branch.startsWith("-") || branch.includes("..") || branch.endsWith("/")) {
    throw Object.assign(new Error("invalid_branch"), { status: 400 });
  }
  const sha = String(body.commitSha || "").toLowerCase();
  if (!/^[a-f0-9]{40}$/.test(sha)) throw Object.assign(new Error("full_commit_sha_required"), { status: 400 });
  const commands = Array.isArray(body.commandIds) ? body.commandIds.map(String) : [];
  const allowedCommands = String(env.ALLOWED_COMMAND_IDS || "typecheck,lint,vite_build")
    .split(",").map((item) => item.trim()).filter(Boolean);
  if (!commands.length || commands.length > 12 || commands.some((id) => !allowedCommands.includes(id))) {
    throw Object.assign(new Error("command_not_allowed"), { status: 400 });
  }
  const key = String(body.idempotencyKey || "");
  if (!/^[A-Za-z0-9:._-]{8,160}$/.test(key)) throw Object.assign(new Error("idempotency_key_required"), { status: 400 });
  return {
    jobId: crypto.randomUUID(),
    key,
    repo,
    branch,
    sha,
    commands,
    requestedBy: String(body.requestedBy || "operator").slice(0, 120),
    now: nowIso(),
  };
}

async function enqueue(request, env) {
  const body = await readBody(request);
  const job = validateJob(body, env);
  await env.DB.prepare(
    `INSERT OR IGNORE INTO autorun_jobs
      (job_id,idempotency_key,repository,branch,commit_sha,command_ids_json,requested_by,status,attempt,max_attempts,available_at,created_at,updated_at)
     VALUES(?,?,?,?,?,?,?,'queued',0,3,?,?,?)`,
  ).bind(job.jobId, job.key, job.repo, job.branch, job.sha, JSON.stringify(job.commands),
    job.requestedBy, job.now, job.now, job.now).run();
  const saved = await env.DB.prepare(
    "SELECT job_id,repository,branch,commit_sha,command_ids_json,status,attempt,max_attempts,created_at,updated_at FROM autorun_jobs WHERE idempotency_key=?",
  ).bind(job.key).first();
  if (!saved) return reply({ error: "queue_write_failed" }, 500);
  if (saved.repository !== job.repo || saved.branch !== job.branch || saved.commit_sha !== job.sha || saved.command_ids_json !== JSON.stringify(job.commands)) {
    return reply({ error: "idempotency_key_conflict" }, 409);
  }
  return reply({ job: { ...saved, commandIds: JSON.parse(saved.command_ids_json) } }, 202);
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function claim(request, env) {
  const body = await readBody(request);
  const runnerId = String(body.runnerId || "").slice(0, 120);
  if (!/^[A-Za-z0-9_.:-]{3,120}$/.test(runnerId)) return reply({ error: "invalid_runner_id" }, 400);
  const leaseSeconds = Math.max(30, Math.min(300, Number(body.leaseSeconds) || 90));
  const now = nowIso();
  const token = randomToken();
  const tokenHash = await sha256Hex(token);
  const expiry = new Date(Date.now() + leaseSeconds * 1000).toISOString();

  await env.DB.prepare(
    `UPDATE autorun_jobs
       SET status=CASE WHEN cancel_requested=1 THEN 'cancelled' WHEN attempt < max_attempts THEN 'queued' ELSE 'failed' END,
           available_at=?, lease_owner=NULL, lease_token_hash=NULL, lease_expires_at=NULL,
           heartbeat_at=NULL, updated_at=?,
           error=CASE WHEN attempt < max_attempts THEN 'lease_expired_recovered' ELSE 'lease_expired_retry_budget_exhausted' END,
           finished_at=CASE WHEN cancel_requested=1 OR attempt >= max_attempts THEN ? ELSE NULL END
     WHERE status IN ('leased','running') AND lease_expires_at IS NOT NULL AND lease_expires_at <= ?`,
  ).bind(now, now, now, now).run();

  const job = await env.DB.prepare(
    `UPDATE autorun_jobs
       SET status='leased', attempt=attempt+1, lease_owner=?, lease_token_hash=?,
           lease_expires_at=?, heartbeat_at=?, updated_at=?, started_at=COALESCE(started_at,?)
     WHERE job_id=(
       SELECT job_id FROM autorun_jobs
       WHERE status='queued' AND available_at <= ? AND cancel_requested=0
       ORDER BY created_at ASC LIMIT 1
     ) AND status='queued'
     RETURNING job_id,repository,branch,commit_sha,command_ids_json,attempt,max_attempts,cancel_requested`,
  ).bind(runnerId, tokenHash, expiry, now, now, now, now).first();

  if (!job) return reply({ job: null }, 200);
  return reply({ job: { ...job, commandIds: JSON.parse(job.command_ids_json), leaseToken: token, leaseExpiresAt: expiry } }, 200);
}

async function leaseContext(body, env) {
  const jobId = String(body.jobId || "");
  const runnerId = String(body.runnerId || "");
  const token = String(body.leaseToken || "");
  if (!/^[0-9a-f-]{36}$/i.test(jobId) || !runnerId || token.length < 32 || token.length > 128) {
    throw Object.assign(new Error("invalid_lease_identity"), { status: 400 });
  }
  return { jobId, runnerId, tokenHash: await sha256Hex(token) };
}

async function heartbeat(request, env) {
  const body = await readBody(request);
  const lease = await leaseContext(body, env);
  const current = await env.DB.prepare(
    "SELECT cancel_requested,status FROM autorun_jobs WHERE job_id=? AND lease_owner=? AND lease_token_hash=? AND status IN ('leased','running') AND lease_expires_at>?",
  ).bind(lease.jobId, lease.runnerId, lease.tokenHash, nowIso()).first();
  if (!current) return reply({ error: "lease_lost" }, 409);
  if (current.cancel_requested) return reply({ cancelRequested: true, status: current.status }, 200);
  const now = nowIso();
  const expiry = new Date(Date.now() + 90_000).toISOString();
  await env.DB.prepare(
    "UPDATE autorun_jobs SET heartbeat_at=?,lease_expires_at=?,updated_at=? WHERE job_id=? AND lease_owner=? AND lease_token_hash=? AND status IN ('leased','running') AND cancel_requested=0",
  ).bind(now, expiry, now, lease.jobId, lease.runnerId, lease.tokenHash).run();
  return reply({ cancelRequested: false, leaseExpiresAt: expiry }, 200);
}

async function start(request, env) {
  const body = await readBody(request);
  const lease = await leaseContext(body, env);
  const now = nowIso();
  const result = await env.DB.prepare(
    "UPDATE autorun_jobs SET status='running',started_at=COALESCE(started_at,?),updated_at=? WHERE job_id=? AND lease_owner=? AND lease_token_hash=? AND status='leased' AND lease_expires_at>?",
  ).bind(now, now, lease.jobId, lease.runnerId, lease.tokenHash, now).run();
  return result.meta?.changes
    ? reply({ started: true }, 200)
    : reply({ error: "lease_lost" }, 409);
}

async function complete(request, env) {
  const body = await readBody(request);
  const lease = await leaseContext(body, env);
  const outcome = String(body.outcome || "");
  if (!["succeeded","failed","timed_out"].includes(outcome)) return reply({ error: "invalid_outcome" }, 400);
  const now = nowIso();
  const prior = await env.DB.prepare("SELECT attempt,cancel_requested FROM autorun_jobs WHERE job_id=? AND lease_owner=? AND lease_token_hash=? AND status IN ('leased','running') AND lease_expires_at>?").bind(lease.jobId, lease.runnerId, lease.tokenHash, now).first();
  if (!prior) return reply({ error: "lease_lost" }, 409);
  const resultJson = JSON.stringify(body.result ?? {}).slice(0, 24_000);
  const error = String(body.error || "").slice(0, 2_000);
  const result = await env.DB.prepare(
    `UPDATE autorun_jobs
       SET status=CASE
         WHEN cancel_requested=1 THEN 'cancelled'
         WHEN ?='succeeded' THEN 'succeeded'
         WHEN attempt < max_attempts THEN 'queued'
         ELSE ? END,
         available_at=CASE WHEN ?='succeeded' OR attempt>=max_attempts OR cancel_requested=1 THEN available_at
           ELSE ? END,
         lease_owner=NULL,lease_token_hash=NULL,lease_expires_at=NULL,heartbeat_at=NULL,
         result_json=?,error=?,updated_at=?,
         finished_at=CASE WHEN cancel_requested=1 OR ?='succeeded' OR attempt>=max_attempts THEN ? ELSE NULL END
     WHERE job_id=? AND lease_owner=? AND lease_token_hash=? AND status IN ('leased','running') AND lease_expires_at>?`,
  ).bind(outcome, outcome, outcome, new Date(Date.now() + Math.min(900_000, 30_000 * (2 ** Math.max(0, Number(prior.attempt) - 1)))).toISOString(),
    resultJson, error, now, outcome, now, lease.jobId, lease.runnerId, lease.tokenHash, now).run();
  if (!result.meta?.changes) return reply({ error: "lease_lost" }, 409);
  const saved = await env.DB.prepare("SELECT status,attempt FROM autorun_jobs WHERE job_id=?").bind(lease.jobId).first();
  return reply({ completed: true, status: saved.status, attempt: saved.attempt }, 200);
}

async function cancel(request, env) {
  const body = await readBody(request);
  const jobId = String(body.jobId || "");
  if (!/^[0-9a-f-]{36}$/i.test(jobId)) return reply({ error: "invalid_job_id" }, 400);
  const now = nowIso();
  await env.DB.prepare(
    `UPDATE autorun_jobs
       SET status=CASE WHEN status IN ('queued','leased') THEN 'cancelled' ELSE status END,
           cancel_requested=CASE WHEN status='running' THEN 1 ELSE cancel_requested END,
           lease_owner=CASE WHEN status IN ('queued','leased') THEN NULL ELSE lease_owner END,
           lease_token_hash=CASE WHEN status IN ('queued','leased') THEN NULL ELSE lease_token_hash END,
           lease_expires_at=CASE WHEN status IN ('queued','leased') THEN NULL ELSE lease_expires_at END,
           finished_at=CASE WHEN status IN ('queued','leased') THEN ? ELSE finished_at END,
           updated_at=?
     WHERE job_id=? AND status IN ('queued','leased','running')`,
  ).bind(now, now, jobId).run();
  const saved = await env.DB.prepare("SELECT status,cancel_requested FROM autorun_jobs WHERE job_id=?").bind(jobId).first();
  return saved ? reply({ jobId, ...saved }, 200) : reply({ error: "job_not_found" }, 404);
}

async function listJobs(request, env) {
  const url = new URL(request.url);
  const limit = Math.max(1, Math.min(100, Number(url.searchParams.get("limit")) || 50));
  const rows = await env.DB.prepare(
    "SELECT job_id,repository,branch,commit_sha,status,attempt,max_attempts,lease_owner,lease_expires_at,heartbeat_at,cancel_requested,created_at,updated_at,finished_at,error FROM autorun_jobs ORDER BY created_at DESC LIMIT ?",
  ).bind(limit).all();
  return reply({ jobs: rows.results || [] }, 200);
}

async function listEvents(request, env) {
  const url = new URL(request.url);
  const limit = Math.max(1, Math.min(200, Number(url.searchParams.get("limit")) || 100));
  const jobId = url.searchParams.get("jobId");
  const statement = jobId
    ? env.DB.prepare("SELECT event_id,job_id,event_type,status,runner_id,details_json,created_at FROM autorun_job_events WHERE job_id=? ORDER BY event_id DESC LIMIT ?").bind(jobId, limit)
    : env.DB.prepare("SELECT event_id,job_id,event_type,status,runner_id,details_json,created_at FROM autorun_job_events ORDER BY event_id DESC LIMIT ?").bind(limit);
  const rows = await statement.all();
  return reply({ events: rows.results || [] }, 200);
}

export async function handleDurableQueueRequest(request, env) {
  const path = new URL(request.url).pathname;
  if (!path.startsWith("/api/v1/autorun/queue/")) return null;
  if (!["GET","POST"].includes(request.method)) return reply({ error: "method_not_allowed" }, 405);
  const auth = await authorize(request, env);
  if (!auth.ok) return reply({ error: auth.error }, auth.status);

  try {
    if (request.method === "POST" && path === "/api/v1/autorun/queue/jobs") return await enqueue(request, env);
    if (request.method === "POST" && path === "/api/v1/autorun/queue/claim") return await claim(request, env);
    if (request.method === "POST" && path === "/api/v1/autorun/queue/heartbeat") return await heartbeat(request, env);
    if (request.method === "POST" && path === "/api/v1/autorun/queue/start") return await start(request, env);
    if (request.method === "POST" && path === "/api/v1/autorun/queue/complete") return await complete(request, env);
    if (request.method === "POST" && path === "/api/v1/autorun/queue/cancel") return await cancel(request, env);
    if (request.method === "GET" && path === "/api/v1/autorun/queue/jobs") return await listJobs(request, env);
    if (request.method === "GET" && path === "/api/v1/autorun/queue/events") return await listEvents(request, env);
    return reply({ error: "not_found" }, 404);
  } catch (error) {
    return reply({ error: error instanceof Error ? error.message : "queue_error" }, error?.status || 500);
  }
}
