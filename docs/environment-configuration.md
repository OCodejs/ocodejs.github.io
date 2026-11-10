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

## Account Portal Auth.js — isolated Preview

The following values are required before `GET /api/health` can report `ready`:

| Name | Secret? | Purpose |
|---|---:|---|
| `DATABASE_URL` | Yes | Dedicated Preview PostgreSQL connection string |
| `AUTH_SECRET` | Yes | Auth.js signing/encryption secret |
| `AUTH_URL` | No | Exact Preview origin |
| `AUTH_GITHUB_ID` | No | GitHub OAuth application client ID |
| `AUTH_GITHUB_SECRET` | Yes | GitHub OAuth application client secret |
| `AUTH_GOOGLE_ID` | No | Google OAuth application client ID |
| `AUTH_GOOGLE_SECRET` | Yes | Google OAuth application client secret |

All seven values must be configured in the Preview environment only. The Preview needs its own PostgreSQL database; do not reuse the production database or the separate OCodeJS CLI D1 database. Configure provider callback URLs only after the final Preview hostname is fixed:

- `/api/auth/callback/github`
- `/api/auth/callback/google`

The current Preview build is protected by the existing Cloudflare Access policy. It has no database or OAuth secrets configured; sign-in remains disabled and end-to-end authentication is unverified.

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
