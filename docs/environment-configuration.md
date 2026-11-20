---
---

# Environment Configuration

This document lists configuration names and their scope. It intentionally contains no credential values.

## Control API — staging Worker

| Name | Type | Purpose | Current state |
|---|---|---|---|
| `ALLOWED_ORIGINS` | Non-secret variable; comma-separated origins | Adds browser origins to the built-in GitHub Pages origin allowlist | Optional; no additional origin is required for the current Pages frontend |
| Workers Logs / Traces settings | Cloudflare Worker observability configuration | Persist request logs and traces with query-string redaction | Enabled on staging |

The Control API does not require a database for its current read-only routes. Do not add a production database or production secrets to this Worker.

### Optional request metrics — staging only

| Name | Type | Purpose | Current state |
|---|---|---|---|
| `OBSERVABILITY` | Workers Analytics Engine dataset binding | Writes bounded request dimensions (method, route family, status class) and duration for operational analysis | Code supports the binding; it is not attached until a staging dataset is explicitly provisioned |

The Worker remains functional when `OBSERVABILITY` is absent. When present, it emits one data point per request. The event writer does not expose a public metrics query endpoint; dashboards, alert evaluation and durable audit exploration remain separate follow-up work. Do not attach this binding to Production as part of this Preview change.

## Account Portal Auth.js — separate Vercel Preview

The canonical Auth.js application is `OCodejs/mcp.auth.ocodejs`, deployed separately from the static GitHub Pages frontend through Vercel project `mcp-auth-ocodejs`. GitHub Pages must never receive passwords, OAuth client secrets, database URLs, provider tokens or session cookies.

| Name | Secret? | Scope / purpose |
|---|---:|---|
| `DATABASE_URL` | Yes | Direct PostgreSQL URL for Prisma CLI and schema validation; Preview target only |
| `DATABASE_URL_POOLED` | Yes | Pooled PostgreSQL URL used by the serverless runtime |
| `AUTH_SECRET` | Yes | Auth.js signing and encryption secret |
| `AUTH_URL` | No | Exact verified Vercel Preview origin |
| `AUTH_PREVIEW_DB_PUSH` | No | Set to `true` only for an explicitly approved Preview schema initialization; never Production |
| `AUTH_GITHUB_ID` | No | GitHub OAuth client ID |
| `AUTH_GITHUB_SECRET` | Yes | GitHub OAuth client secret |
| `AUTH_GOOGLE_ID` | No | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Yes | Google OAuth client secret |

Optional integrations:

| Name | Secret? | Purpose |
|---|---:|---|
| `AUTH_OIDC_ISSUER` | No | Allowlisted upstream OIDC issuer |
| `AUTH_OIDC_ID` | No | Upstream OIDC client ID |
| `AUTH_OIDC_SECRET` | Yes | Upstream OIDC client secret |
| `TOKEN_VAULT_URL` | No | Dedicated Preview Token Vault endpoint |
| `TOKEN_VAULT_ASSERTION_SECRET` | Yes | Server-to-server HMAC assertion key; Vercel Preview and the Staging Worker only |

The Auth repository documents an `auth_preview` schema on its Auth-only PostgreSQL instance. This is logical schema isolation, not a separate physical database. Confirm the actual Preview database resource and schema target before setting `AUTH_PREVIEW_DB_PUSH=true`; do not reuse Production, the CLI D1 database or another application's database.

At the latest audit, project-level `DATABASE_URL` and `DATABASE_URL_POOLED` variables have `development`, `preview` and `production` targets. Branch-scoped Auth.js secrets and Preview flags were present only for older branches; no branch-specific Auth.js variables were returned for `feat/auth-platform-phase1-security-audit`. Variable values were not read. Treat physical database separation as unverified and do not run schema initialization until the exact Preview target and branch-scoped settings are confirmed.

Configure OAuth callback URLs only after the current Preview hostname is verified:

- `https://<VERIFIED_PREVIEW_HOST>/api/auth/callback/github`
- `https://<VERIFIED_PREVIEW_HOST>/api/auth/callback/google`

The latest observed READY Vercel Preview belongs to an older feature branch. Current-mainline Preview, database readiness, OAuth callbacks and session flows remain unverified. Keep sign-in disabled until the Preview release gate passes.
 
## MCP staging Worker

- The Control API destination is a fixed source constant pointing to the OCode.js staging Control API.
- No caller-supplied URL, provider token, OAuth secret, or account credential is accepted.
- The six exposed tools are read-only: health, service listing, agent listing/lookup, and provider listing/lookup.

## AI provider and agent runtime

- Cloudflare Workers AI is catalogued as a candidate provider only.
- No `AI` binding is configured on the staging Control API.
- Provider state is `not_configured`; agent execution is disabled.
- Do not add a binding or enable inference until the model/provider choice, quota policy, cost limits, authorization and approval flow are explicitly reviewed.

## Secret-handling rules

1. Never commit secret values to Git, Markdown, frontend JavaScript, build artifacts, or issue comments.
2. Never paste credentials into ChatGPT messages.
3. Use Cloudflare Preview/Worker secrets for the exact non-production environment that consumes them.
4. Do not copy production OAuth credentials or database URLs into Preview.
5. Rotate any secret that is accidentally exposed; deleting it from a later commit does not remove it from Git history.
