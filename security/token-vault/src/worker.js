const SESSION_TTL = 8 * 60 * 60;
const PRIVILEGED = new Set(["owner", "security_admin"]);
const encoder = new TextEncoder();

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers } });
}
function b64(bytes) { return btoa(String.fromCharCode(...new Uint8Array(bytes))); }
function unb64(value) { return Uint8Array.from(atob(value), c => c.charCodeAt(0)); }
async function digest(value) { return b64(await crypto.subtle.digest("SHA-256", encoder.encode(value))); }
async function hmacKey(secret) { return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]); }
async function signSession(value, secret) { const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(value)); return value + "." + b64(sig); }
async function verifySession(value, secret) {
  if (!value || !value.includes(".")) return null;
  const [id, signature] = value.split(".");
  const expected = await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(id));
  const a = unb64(signature), b = new Uint8Array(expected);
  if (a.length !== b.length || !a.every((v, i) => v === b[i])) return null;
  return id;
}
async function verifyPassword(password, encoded) {
  if (!encoded || !encoded.includes(":")) return false;
  const [salt, expected] = encoded.split(":");
  const material = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: unb64(salt), iterations: 310000, hash: "SHA-256" }, material, 256);
  const actual = new Uint8Array(bits), target = unb64(expected);
  return actual.length === target.length && actual.every((v, i) => v === target[i]);
}
function cookie(value, maxAge) { return `oc_token_session=${value}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`; }
function getCookie(request) {
  const raw = request.headers.get("cookie") || "";
  return raw.split(";").map(v => v.trim()).find(v => v.startsWith("oc_token_session="))?.slice("oc_token_session=".length) || "";
}
function sameOrigin(request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}
async function audit(env, actor, action, resource, outcome = "success") {
  await env.DB.prepare("INSERT INTO audit_events(id,actor,action,resource_id,outcome) VALUES(?,?,?,?,?)")
    .bind(crypto.randomUUID(), actor, action, resource || null, outcome).run();
}
async function session(request, env) {
  const id = await verifySession(getCookie(request), env.SESSION_SIGNING_KEY);
  if (!id) return null;
  const row = await env.DB.prepare("SELECT s.subject,s.role,s.expires_at,i.active FROM sessions s JOIN identities i ON i.subject=s.subject WHERE s.id_hash=? AND s.revoked=0")
    .bind(await digest(id)).first();
  if (!row || !row.active || row.expires_at < Math.floor(Date.now() / 1000)) return null;
  return { subject: row.subject, role: row.role };
}
async function encryptionKey(env) {
  return crypto.subtle.importKey("raw", unb64(env.TOKEN_ENCRYPTION_KEY), "AES-GCM", false, ["encrypt", "decrypt"]);
}
async function rateLimit(request, env) {
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const bucket = await digest(ip + "|" + new URL(request.url).pathname);
  const now = Math.floor(Date.now() / 1000);
  const row = await env.DB.prepare("SELECT attempts,window_started FROM login_attempts WHERE bucket=?").bind(bucket).first();
  if (row && now - row.window_started < 900 && row.attempts >= 8) return false;
  if (!row || now - row.window_started >= 900) {
    await env.DB.prepare("INSERT OR REPLACE INTO login_attempts(bucket,attempts,window_started) VALUES(?,?,?)").bind(bucket, 1, now).run();
  } else {
    await env.DB.prepare("UPDATE login_attempts SET attempts=attempts+1 WHERE bucket=?").bind(bucket).run();
  }
  return true;
}
async function login(request, env) {
  if (!sameOrigin(request)) return json({ error: "Forbidden" }, 403);
  if (!await rateLimit(request, env)) return json({ error: "Too many attempts" }, 429);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Invalid request" }, 400); }
  const password = typeof body.password === "string" ? body.password : "";
  const ok = password.length >= 12 && await verifyPassword(password, env.BOOTSTRAP_PASSWORD_HASH);
  if (!ok) {
    await audit(env, "TOKEN", "login", null, "denied");
    return json({ error: "Unauthorized" }, 401);
  }
  const identity = await env.DB.prepare("SELECT subject,role,active FROM identities WHERE subject='TOKEN'").first();
  if (!identity?.active || identity.role !== "owner") return json({ error: "Bootstrap identity disabled" }, 403);
  const id = b64(crypto.getRandomValues(new Uint8Array(32)));
  const expiry = Math.floor(Date.now() / 1000) + SESSION_TTL;
  await env.DB.prepare("INSERT INTO sessions(id_hash,subject,role,expires_at) VALUES(?,?,?,?)")
    .bind(await digest(id), identity.subject, identity.role, expiry).run();
  await audit(env, "TOKEN", "login", null);
  return json({ ok: true }, 200, { "set-cookie": cookie(await signSession(id, env.SESSION_SIGNING_KEY), SESSION_TTL) });
}
async function handle(request, env) {
  const url = new URL(request.url), path = url.pathname;
  if (request.method === "POST" && path === "/api/login") return login(request, env);
  if (request.method === "POST" && path === "/api/logout") {
    if (!sameOrigin(request)) return json({ error: "Forbidden" }, 403);
    const user = await session(request, env), id = await verifySession(getCookie(request), env.SESSION_SIGNING_KEY);
    if (id) await env.DB.prepare("UPDATE sessions SET revoked=1 WHERE id_hash=?").bind(await digest(id)).run();
    if (user) await audit(env, user.subject, "logout", null);
    return json({ ok: true }, 200, { "set-cookie": cookie("", 0) });
  }
  const user = await session(request, env);
  if (!user) return json({ error: "Unauthorized" }, 401);
  if (request.method === "GET" && path === "/api/me") return json({ subject: user.subject, role: user.role });
  if (request.method === "GET" && path === "/api/tokens") {
    const rows = await env.DB.prepare("SELECT id,label,provider,created_at,rotated_at FROM vault_tokens ORDER BY created_at DESC").all();
    return json({ tokens: rows.results });
  }
  if (request.method === "POST" && path === "/api/tokens") {
    if (!PRIVILEGED.has(user.role)) return json({ error: "Forbidden" }, 403);
    if (!sameOrigin(request)) return json({ error: "Forbidden" }, 403);
    let body;
    try { body = await request.json(); } catch { return json({ error: "Invalid request" }, 400); }
    if (typeof body.label !== "string" || typeof body.provider !== "string" || typeof body.value !== "string" || body.value.length < 8 || body.value.length > 8192) return json({ error: "Invalid token record" }, 400);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await encryptionKey(env), encoder.encode(body.value));
    const id = crypto.randomUUID();
    await env.DB.prepare("INSERT INTO vault_tokens(id,label,provider,ciphertext,iv,created_by) VALUES(?,?,?,?,?,?)")
      .bind(id, body.label.slice(0, 100), body.provider.slice(0, 80), b64(ciphertext), b64(iv), user.subject).run();
    await audit(env, user.subject, "token.create", id);
    return json({ id }, 201);
  }
  const reveal = path.match(/^\/api\/tokens\/([0-9a-f-]+)\/reveal$/i);
  if (request.method === "POST" && reveal) {
    if (!PRIVILEGED.has(user.role)) return json({ error: "Forbidden" }, 403);
    if (!sameOrigin(request)) return json({ error: "Forbidden" }, 403);
    const row = await env.DB.prepare("SELECT ciphertext,iv FROM vault_tokens WHERE id=?").bind(reveal[1]).first();
    if (!row) return json({ error: "Not found" }, 404);
    const clear = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(row.iv) }, await encryptionKey(env), unb64(row.ciphertext));
    await audit(env, user.subject, "token.reveal", reveal[1]);
    return json({ value: new TextDecoder().decode(clear) });
  }
  const remove = path.match(/^\/api\/tokens\/([0-9a-f-]+)$/i);
  if (request.method === "DELETE" && remove) {
    if (!PRIVILEGED.has(user.role)) return json({ error: "Forbidden" }, 403);
    if (!sameOrigin(request)) return json({ error: "Forbidden" }, 403);
    await env.DB.prepare("DELETE FROM vault_tokens WHERE id=?").bind(remove[1]).run();
    await audit(env, user.subject, "token.delete", remove[1]);
    return json({ ok: true });
  }
  return json({ error: "Not found" }, 404);
}
export default { fetch: handle };
