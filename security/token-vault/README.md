# OCode.js Token Vault

A private credential-management service for OCode.js projects. This source package contains no live credentials.

## Current implementation

- Bootstrap identity is fixed to TOKEN; the sign-in screen asks for a password only.
- Password verification uses PBKDF2-SHA-256 with 310,000 iterations. The verifier is configured as Worker secret BOOTSTRAP_PASSWORD_HASH.
- Token values are encrypted server-side with AES-256-GCM and a fresh 96-bit IV before D1 storage.
- Each token is assigned a project ID (default: ocodejs-core).
- Session cookies are Secure, HttpOnly, SameSite=Strict, signed with a separate key, and expire after four hours. Server-side revocation is supported.
- State-changing browser requests require an exact same-origin Origin and reject cross-site Fetch Metadata.
- Login and reveal operations have IP-based D1 rate limits. Authentication responses do not reveal whether an identity exists.
- The Worker sends no-store and browser security headers. Session role is read from the current identity row on every request.
- The Worker serves its password-only login and credential inventory UI at / and /vault.
- Token reveal is explicit, audited, and restricted to owner and security_admin. The dashboard clears a revealed value after 15 seconds.

## AI Agent access

Owners can issue a unique machine credential for each agent. The raw API key is shown only once; D1 stores only its SHA-256 hash. Keys expire after 1–365 days (90 days by default) and can be revoked.

Each agent receives explicit per-project grants:

- metadata: list credential metadata for that project.
- reveal: list metadata and reveal token values for that project.

An agent cannot enumerate other projects, use the human session cookie, or call the browser login. Agent endpoints reject requests carrying an Origin header and require a bearer key. Every successful agent reveal is audited. Never grant an agent a human owner or security_admin role.

Example machine API:

    GET /api/agent/tokens?project_id=ocodejs-core
    Authorization: Bearer oca_<one-time-key>

For an approved reveal grant:

    POST /api/agent/tokens/<token-id>/reveal
    Authorization: Bearer oca_<one-time-key>

## Required Cloudflare resources

- Cloudflare Worker runtime.
- D1 database created from schema.sql.
- D1 binding named DB.
- Worker secrets: BOOTSTRAP_PASSWORD_HASH, SESSION_SIGNING_KEY, TOKEN_ENCRYPTION_KEY.
- Worker variable: ACCESS_REQUIRED=true before staging/production exposure.
- Cloudflare Access Self-hosted application for the Worker hostname, with Allow policies restricted to approved staff identity emails or groups. Do not add a public bypass policy.

Generate a new unique password locally with the hidden-input utility in scripts/hash-password.mjs. Store only its output as BOOTSTRAP_PASSWORD_HASH. Generate independent random 32-byte signing and encryption keys; store them as Worker secrets. The password previously supplied in chat is exposed and must never be used.

The encryption key is expected as Base64 or Base64URL encoding of exactly 32 random bytes. The signing key must be at least 32 characters. Do not reuse key material across purposes.

## Roles and current limitations

| Role | Browse metadata | Create / reveal / delete | Manage AI agents |
|---|---:|---:|---:|
| owner | Yes | Yes | Yes |
| security_admin | Yes | Yes | No |
| developer | Yes | No | No |
| ai_agent | Project-scoped | Project-granted reveal only | No |
| auditor | Yes | No | No |

Staff use Cloudflare Access SSO. An owner provisions each staff email and assigns security_admin, developer, or auditor; the email from ctx.access.getIdentity() must match an active D1 identity. Set ACCESS_REQUIRED=true on the Worker before exposure. This also blocks direct workers.dev access for browser/human routes; the independent bearer-key agent API remains protected by its own project-scoped credentials. The TOKEN password remains the bootstrap owner login and is never shared with staff or agents.

## API

- POST /api/login — password-only bootstrap login.
- POST /api/logout — revoke the current session.
- GET /api/me — current identity and role.
- GET /api/tokens — credential metadata.
- POST /api/tokens — encrypt and store a project-scoped credential.
- POST /api/tokens/:id/reveal — privileged human reveal with audit event.
- DELETE /api/tokens/:id — privileged deletion with audit event.
- GET /api/members, POST /api/members — owner-only personnel inventory and Access email provisioning.
- PATCH /api/members/:email — update staff role.
- DELETE /api/members/:email — disable staff identity and revoke sessions.
- GET /api/agents, POST /api/agents — owner-only agent inventory and one-time key issuance.
- GET/POST /api/agents/:subject/grants — owner-only project grants.
- DELETE /api/agents/:subject — revoke an agent.
- GET /api/agent/tokens?project_id=... — agent metadata within granted project.
- POST /api/agent/tokens/:id/reveal — agent reveal only with an explicit reveal grant.

## Validation and deployment

Run node security/token-vault/scripts/check-source.mjs for source validation and node --test security/token-vault/tests/*.test.mjs for Worker smoke tests. This repository change is not a deployment. No Worker, D1 database, Access policy, secrets, or live tokens have been created or configured. Keep the service behind Cloudflare Access before any staging exposure.


Schema validation is executed against an in-memory SQLite database in CI before the Worker integration suite.

Cloudflare Workers exposes authenticated Access identity through ctx.access; the Worker uses the verified email claim and then checks the matching active D1 identity before assigning application permissions. See the official Cloudflare Workers Access integration guide: https://developers.cloudflare.com/workers/configuration/cloudflare-access/.

Staff Access identity is checked against the active D1 identity record on every authenticated request.
