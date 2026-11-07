# OCode.js Token Vault

A private credential-management service for OCode.js projects. This source package contains no live credentials.

## Current implementation

- Bootstrap identity is fixed to `TOKEN`; the sign-in screen asks for a password only.
- Password verification uses PBKDF2-SHA-256 with 310,000 iterations. The verifier is configured as Worker secret `BOOTSTRAP_PASSWORD_HASH`.
- Token values are encrypted server-side with AES-256-GCM and a fresh 96-bit IV before D1 storage.
- Session cookies are Secure, HttpOnly, SameSite=Strict, signed with a separate key, and expire after four hours. Server-side revocation is supported.
- State-changing browser requests require an exact same-origin `Origin` and reject cross-site Fetch Metadata.
- Login and reveal operations have IP-based D1 rate limits. Authentication responses do not reveal whether an identity exists.
- The Worker sends no-store and browser security headers. Session role is read from the current identity row, not copied from an old session snapshot.
- The Worker currently serves its password-only login and credential inventory UI at `/` and `/vault`.
- Token reveal is explicit, audited, and restricted to `owner` and `security_admin`. The dashboard clears a revealed value after 15 seconds.

## Required Cloudflare resources

- Cloudflare Worker runtime.
- D1 database created from `schema.sql`.
- D1 binding named `DB`.
- Worker secrets: `BOOTSTRAP_PASSWORD_HASH`, `SESSION_SIGNING_KEY`, `TOKEN_ENCRYPTION_KEY`.

Generate a new unique password locally with the hidden-input utility in `scripts/hash-password.mjs`. Store only its output as `BOOTSTRAP_PASSWORD_HASH`. Generate independent random 32-byte signing and encryption keys; store them as Worker secrets. The password previously supplied in chat is exposed and must never be used.

The encryption key is expected as Base64 or Base64URL encoding of exactly 32 random bytes. The signing key must be at least 32 characters. Do not reuse key material across purposes.

## Roles and current limitations

| Role | Browse metadata | Create / reveal / delete |
|---|---:|---:|
| owner | Yes | Yes |
| security_admin | Yes | Yes |
| developer | Yes | No |
| ai_agent | Yes | No |
| auditor | Yes | No |

The current API only bootstraps the `TOKEN` owner identity. It does **not yet** provision staff identities, issue scoped AI-agent grants, or provide a safe token-broker/proxy for agents. Do not grant an agent a human administrator role. The next security milestone is individual identity provisioning plus project-scoped capabilities and audited approval. Until then, AI-agent and staff access is not enabled.

## API

- `POST /api/login` — password-only bootstrap login.
- `POST /api/logout` — revoke the current session.
- `GET /api/me` — current identity and role.
- `GET /api/tokens` — credential metadata only.
- `POST /api/tokens` — encrypt and store a credential.
- `POST /api/tokens/:id/reveal` — privileged reveal with audit event.
- `DELETE /api/tokens/:id` — privileged deletion with audit event.

## Validation and deployment

Run `node security/token-vault/scripts/check-source.mjs` for source validation and `node --test security/token-vault/tests/*.test.mjs` for Worker smoke tests. This repository change is not a deployment. No Worker, D1 database, Access policy, secrets, or live tokens have been created or configured. Keep the service behind Cloudflare Access before any staging exposure.
