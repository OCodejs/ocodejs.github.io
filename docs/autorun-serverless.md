# OCodeJS AutoRun — Serverless staging

## Scope

GitHub remains the source of truth for repositories and Pull Requests. A single GitHub Actions workflow runs the AutoRun test suite. Pull requests execute tests only; trusted pushes to the default branch execute the same tests and then report the completed result directly to the Cloudflare staging Control API using a short-lived GitHub OIDC token. D1 stores run snapshots and idempotent event records.

This phase tracks completed main-branch workflow runs. It does not replace GitHub Actions, dispatch arbitrary workflows, execute user-supplied shell commands, or provide an independent runner pool. It deliberately does not use a `workflow_run` bridge.

## Components

- `.github/workflows/autorun-control-api-tests.yml`: one workflow for PR tests and trusted main-branch test-and-report execution. Only the report job has `id-token: write`; it does not check out or execute repository code.
- `infra/autorun/control-api/src/index.js`: verifies the OIDC JWT signature against GitHub's JWKS, then checks issuer, audience, repository name and ID, exact workflow ref, push event, main ref, and run ID/attempt.
- `infra/autorun/migrations/0001_autorun.sql`: run snapshots and append-only event history.
- `autorun/workspace.js`: read-only dashboard for persisted completed runs; shows unavailable state rather than fabricated live data when API is not configured.

## Reporting flow

1. A pull request triggers the `test` job only. No OIDC token is requested and no staging write is attempted.
2. A push to `main` triggers the same `test` job.
3. The dependent `report` job runs even if tests fail, but only for a push to `refs/heads/main`.
4. The report job requests a short-lived OIDC token with audience `ocodejs-autorun-staging` and posts the test result to `/api/v1/autorun/events`.
5. The Worker verifies that the OIDC run ID and attempt match the submitted payload, then writes `autorun_runs` and `autorun_events` in one D1 batch.

Only completed main-branch runs are mirrored into D1. PR results remain available in GitHub Actions and are not written to staging.

## Required staging setup

1. Use the existing dedicated D1 database `ocodejs-autorun-staging`; do not create a replacement.
2. Confirm the existing schema contains `autorun_runs` and `autorun_events` before enabling writes. The existing migration is `infra/autorun/migrations/0001_autorun.sql`; do not apply it without explicit approval.
3. Bind the existing database as `DB` to the staging Worker `ocodejs-autorun-control-staging` using `infra/autorun/control-api/wrangler.jsonc`.
4. Keep the `workers.dev` staging hostname only. Do not add a custom domain or route.
5. The staging Worker endpoint is `https://ocodejs-autorun-control-staging.ocodejs-df1.workers.dev`; it is not a secret.
6. Set the Worker trust variables to the exact repository, repository ID and workflow ref in `wrangler.jsonc`.
7. Verify `GET /health/live`, then `GET /api/v1/autorun/summary` and `GET /api/v1/autorun/jobs`. After the trusted workflow runs, read back the same run from both D1 tables.

## Security

- Only the exact repository and default-branch workflow identity are trusted.
- OIDC audience is `ocodejs-autorun-staging`; token signature is verified against GitHub's published JWKS.
- The Worker accepts only `push` tokens for `refs/heads/main` from the exact reporting workflow.
- The submitted run ID, run attempt, repository name and repository ID must match signed OIDC claims.
- Only GET dashboard endpoints are public; event ingestion requires a valid short-lived OIDC token.
- Request bodies are capped at 32 KB. Event IDs are idempotent per run and attempt.
- The Worker does not execute repository code.
- Do not store workflow logs, secrets or artifact contents in D1. Add artifact storage only after separate retention and cost review.

## Cost and production boundaries

The Worker and D1 must remain within the account's free allowance. Check the current plan and usage before provisioning. No paid resource, Production route, DNS change, repository migration or PR merge is part of this implementation.
