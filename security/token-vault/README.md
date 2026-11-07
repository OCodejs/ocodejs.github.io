# OCode.js Token Vault

A private credential-management service for OCode.js projects. This directory is an application source package, not a place to store actual credentials.

## Security model

- The bootstrap account identifier is fixed to `TOKEN`; the login screen asks only for a password.
- The bootstrap password is configured as a Cloudflare Worker secret in PBKDF2-SHA-256 format. It is never committed.
- Do not use a password that has been pasted into chat, source control, screenshots, or logs. The password mentioned in the project request is considered exposed and must be replaced with a new, unique password before deployment.
- Token values are encrypted server-side with AES-256-GCM before D1 storage. The encryption key is a separate Worker secret.
- Session cookies are HttpOnly, Secure, SameSite=Strict, signed with a separate secret, and expire.
- Token plaintext is returned only from an explicit reveal endpoint to roles `owner` and `security_admin`; every reveal is audited.
- Developer and AI-agent roles receive metadata / masked values by default, never plaintext.
- Login attempts are rate-limited in D1. Responses do not disclose whether an account exists.
- No token is ever placed in browser storage, HTML, client-side JavaScript, URL parameters, logs, or repository files.

## Required Cloudflare resources

- Workers runtime for the API and static frontend.
- D1 database using `schema.sql`.
- Worker secrets: `BOOTSTRAP_PASSWORD_HASH`, `SESSION_SIGNING_KEY`, `TOKEN_ENCRYPTION_KEY`.
- Bind D1 as `DB`.

Generate a password hash outside the repository using PBKDF2-SHA-256 (minimum 310,000 iterations), then set the resulting `salt:hash` value as `BOOTSTRAP_PASSWORD_HASH`. Generate independent random 32-byte values for the signing and encryption keys. Never reuse the same key for multiple purposes.

## Roles

| Role | Browse metadata | Create / rotate | Reveal plaintext | Manage members |
|---|---:|---:|---:|---:|
| owner | Yes | Yes | Yes | Yes |
| security_admin | Yes | Yes | Yes | Limited |
| developer | Yes | Request only | No | No |
| ai_agent | Scoped metadata | Scoped request only | No | No |
| auditor | Audit metadata | No | No | No |

The bootstrap `TOKEN` identity is the initial owner. Additional identities must be provisioned by an owner through a future audited admin workflow; never share the bootstrap password with developers or agents.

## API

- `POST /api/login` — password-only bootstrap login.
- `POST /api/logout` — clear session.
- `GET /api/me` — current role.
- `GET /api/tokens` — metadata and masked token values.
- `POST /api/tokens` — encrypt and store a token.
- `POST /api/tokens/:id/reveal` — privileged reveal with audit record.
- `DELETE /api/tokens/:id` — privileged delete with audit record.

## Deployment status

This is a staging implementation proposal in the OCode.js control repository. It has not been deployed and does not contain any live secrets. Protect the eventual hostname with Cloudflare Access as an additional identity/network gate, and keep the Worker API private to the intended application origin.
