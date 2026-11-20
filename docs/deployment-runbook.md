---
---

# Deployment Runbook

## Environments

| Environment | Target | Purpose | Release policy |
|---|---|---|---|
| GitHub Pages | `https://ocodejs.github.io/` | Static Control Center | Updated only after an approved merge to `main` and successful Pages workflow |
| Control API staging | `ocodejs-server-api-staging` | Read-only service, agent and provider registries | Staging-only Worker versions; no Production routes |
| MCP staging | `ocodejs-mcp-staging` | Streamable HTTP MCP endpoint | Fixed read-only tool allowlist |
| Account Auth Preview | Vercel Preview project `mcp-auth-ocodejs`, protected by Vercel SSO | Separate Auth.js build and route validation | Preview-only database and secrets; no Production deployment |

## Change workflow

1. Read the current branch, PR base, current Worker version and relevant workflow status.
2. Create a feature branch; do not commit directly to `main`.
3. Add or update tests and documentation with the code change.
4. Open a PR. For stacked work, record the exact base PR and merge order in the PR body.
5. Wait for all relevant CI jobs to pass:
   - Control API unit tests
   - MCP Worker unit tests
   - Control Center inline JavaScript validation
   - OCode.js Pages theme validation
   - Static accessibility and local Markdown link checks
6. Deploy only the named staging Worker after CI passes.
7. Read back the Worker version and deployment. Confirm that the intended staging version receives 100% of staging traffic.
8. Record the deployment ID, version ID, CI run and remaining verification gaps in the PR.
9. Do not merge PRs or deploy Production unless explicitly approved.

## Staging smoke checks

The current staging API routes are read-only. The runtime readiness route must report `not_configured`, `executionEnabled: false`, and `runLifecycle: disabled` until a provider and isolated run store are deliberately configured:

- `GET /api/v1/health/live`
- `GET /api/v1/health/ready`
- `GET /api/v1/services`
- `GET /api/v1/agents`
- `GET /api/v1/providers`
- `GET /api/v1/providers/{providerId}`
- `GET /api/v1/runtime/status`
- `GET /api/v1/mcp/connections`

The MCP staging endpoint is:

`https://ocodejs-mcp-staging.huynhthuongg2505-f9b.workers.dev/mcp`

Perform MCP checks in this order:

1. `initialize` with protocol version `2025-03-26`.
2. Send `notifications/initialized`.
3. Call `tools/list`.
4. Confirm the exact six-tool read-only allowlist: `get_control_api_health`, `list_services`, `list_agents`, `get_agent_definition`, `list_providers`, `get_provider_definition`.
5. Do not invoke a write tool; none should be exposed.

The connected execution runner currently blocks outbound HTTP requests to Workers.dev hostnames. Therefore, a successful upload/deployment is not equivalent to a successful external HTTP smoke test. Keep that distinction in release notes.

## Account Auth Preview gate

1. Confirm the Vercel project is `mcp-auth-ocodejs`, linked to `OCodejs/mcp.auth.ocodejs`, and that Preview remains protected by Vercel SSO.
2. Reconcile `package.json` and `package-lock.json` before requesting a new Preview build. The current mainline lockfile still names `@prisma/adapter-neon` while the manifest and Prisma client use `@prisma/adapter-pg` and `pg`.
3. Confirm the Preview database is a dedicated non-production Auth resource. The Auth repository currently describes schema-level `auth_preview` isolation on an Auth-only PostgreSQL instance; verify the actual target before initializing it. The current Vercel project has project-level database variable names targeting Preview and Production, while the latest Preview branch has no branch-specific Auth.js variables in the read-only inventory. Do not assume physical isolation.
4. Configure Preview-only `DATABASE_URL`, `DATABASE_URL_POOLED`, `AUTH_SECRET`, `AUTH_URL`, provider credentials and `AUTH_PREVIEW_DB_PUSH=true` only where schema initialization is explicitly intended. Never set the Preview push flag in Production.
5. Confirm `GET /api/health` returns `200 ready` against the intended Preview database.
6. Verify registration, invalid-password handling, GitHub OAuth, Google OAuth, session persistence, profile creation, logout and negative authorization cases.
7. Keep sign-in disabled until all checks pass on a fresh Preview built from current mainline.

The last observed READY Preview belongs to an older feature branch and is not a current-mainline release candidate. A successful build alone does not prove database or authentication readiness.

## Rollback

- For a staging Worker regression, identify the last known-good staging version and restore that version using the Cloudflare Worker deployment controls.
- Verify the resulting staging deployment percentage and health endpoints.
- Do not change production Worker versions, routes, DNS or secrets as part of a staging rollback.
- Record the failed version, rollback version and relevant request IDs.

## Production release gate

Production remains disconnected. A Production release requires a separate explicit approval after:

- Authentication and authorization are verified.
- Agent provider selection, execution policy, quotas and approval gates are implemented.
- MCP write operations, if ever required, have authentication and destination validation.
- Metrics, audit storage, alerting and retention are operational.
- Security review, load tests, recovery tests and rollback drills pass.
