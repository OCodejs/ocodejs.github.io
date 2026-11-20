# OCodeJS AutoRun — Serverless staging

## Scope

GitHub remains the source of truth for Git repositories and Pull Requests. GitHub Actions hosted runners execute workflows. Cloudflare Workers provides a read-only dashboard API plus an OIDC-authenticated lifecycle ingestion endpoint. D1 stores workflow run snapshots and idempotent event records.

This phase tracks GitHub Actions workflow runs; it does not replace GitHub Actions, dispatch arbitrary workflows, execute user-supplied shell commands, or provide an independent runner pool.

## Components

- `.github/workflows/autorun-events.yml`: receives `workflow_run` lifecycle events and requests a short-lived GitHub OIDC token.
- `infra/autorun/control-api/src/index.js`: verifies the OIDC JWT signature against GitHub's JWKS, then checks issuer, audience, repository, workflow identity, event name and default-branch ref.
- `infra/autorun/migrations/0001_autorun.sql`: run snapshots and append-only event history.
- `autorun/workspace.js`: dashboard view; must show unavailable state rather than fabricated live data when API is not configured.

## Required staging setup

1. Create a **dedicated** D1 database named `ocodejs-autorun-staging`. Do not reuse `ocodejs-central-api-preview`: it is already bound to a Worker targeting `ocodejs.dev`. Do not reuse the CLI Auth database for unrelated job telemetry.
2. Apply `infra/autorun/migrations/0001_autorun.sql` to the dedicated database.
3. Bind it as `DB` to a new Worker named `ocodejs-autorun-control-staging` using the config in `infra/autorun/control-api/wrangler.jsonc`.
4. Keep `workers.dev` staging hostname only. Do not add a custom domain or route.
5. Set repository variable `AUTORUN_CONTROL_API` to the resulting Worker URL. It is a URL, not a secret.
6. Enable the workflow on the default branch. No PAT, API key, long-lived runner credential or secret is needed for the OIDC event bridge.
7. Verify `GET /health/live`, `GET /api/v1/autorun/summary`, then run a harmless workflow and confirm it appears in the dashboard.

## Security

- Only the exact repository and default-branch workflow identity are trusted.
- OIDC audience is `ocodejs-autorun-staging`; token signature is verified against GitHub's published JWKS.
- Only GET dashboard endpoints are public; event ingestion requires a valid short-lived OIDC token.
- Request bodies are capped at 32 KB. Event IDs are idempotent per run, attempt and lifecycle action.
- No repository code is executed by the Worker.
- Do not store workflow logs, secrets or artifact contents in D1. Add artifact storage only after separate retention and cost review.

## Cost and production boundaries

The Worker and D1 must remain within the account's free allowance. Check the current plan and usage before provisioning. No paid resource, Production route, DNS change, repository migration or PR merge is part of this phase.
