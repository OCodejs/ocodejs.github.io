# OCodeJS Server — Security Baseline

## Identity and authorization
- Use a maintained OIDC/OAuth implementation; do not implement cryptographic protocols manually.
- Enforce authorization server-side on every route and tool call.
- Start with owner, admin, developer and viewer roles; scope permissions to projects and environments.
- Protect sessions with HttpOnly, Secure and appropriate SameSite cookies; rotate session IDs after authentication and privilege changes.
- Add CSRF protection to cookie-authenticated mutations.
- Require step-up authentication for credential rotation and destructive actions.

## Secrets
- Store model provider keys, OAuth secrets, database URLs, signing keys and MCP credentials in a server-side secret manager.
- Never place secrets in static source, browser storage, query strings, logs or issue reports.
- Return secret metadata, not secret values. Support rotation, revocation and audit trails.

## API and network controls
- Require authentication by default; document public endpoints explicitly.
- Validate schemas, content types, payload sizes and request rates.
- Apply SSRF controls to MCP/webhook destinations: block loopback, link-local, private and metadata IP ranges unless explicitly allowed; re-check redirects and DNS resolutions.
- Use outbound allowlists where possible; set timeouts and bounded response sizes.

## AI agent safety
- Treat model output, retrieved documents and MCP tool output as untrusted.
- Use per-agent tool allowlists and least-privilege scopes.
- Require user confirmation for high-impact operations such as publishing, deleting data, changing access or spending money.
- Do not let retrieved content grant permissions.
- Redact secrets and personal data from prompts, traces and stored run output.

## Audit and incident response
Record actor, action, target, timestamp, request ID, result and environment for security-sensitive operations. Never log passwords, tokens, authorization headers or raw secrets.

Document credential revocation, session invalidation, backup restoration and incident communication before production launch.
