# Deployment Runbook

## Environments

| Environment | Target | Purpose | Release policy |
|---|---|---|---|
| GitHub Pages | `https://ocodejs.github.io/` | Static Control Center | Updated only after an approved merge to `main` and successful Pages workflow |
| Control API staging | `ocodejs-server-api-staging` | Read-only service, agent and provider registries | Staging-only Worker versions; no Production routes |
| MCP staging | `ocodejs-mcp-staging` | Streamable HTTP MCP endpoint | Fixed read-only tool allowlist |
| Account Auth Preview | Cloudflare Workers Preview URL protected by Access | Build and route validation | No production deploy command; dedicated Preview resources required |

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
- `GET /api/v1/runtime/status`
- `GET /api/v1/mcp/connections`

The MCP staging endpoint is:

`https://ocodejs-mcp-staging.huynhthuongg2505-f9b.workers.dev/mcp`

Perform MCP checks in this order:

1. `initialize` with protocol version `2025-03-26`.
2. Send `notifications/initialized`.
3. Call `tools/list`.
4. Confirm the exact read-only allowlist: `get_control_api_health`, `list_services`, `list_agents`, `get_agent_definition`.
5. Do not invoke a write tool; none should be exposed.

The connected execution runner currently blocks outbound HTTP requests to Workers.dev hostnames. Therefore, a successful upload/deployment is not equivalent to a successful external HTTP smoke test. Keep that distinction in release notes.

## Account Auth Preview gate

1. Confirm the Preview hostname is protected by the existing Cloudflare Access policy.
2. Configure the seven Preview-only values listed in [Environment Configuration](environment-configuration.md).
3. Attach a dedicated Preview PostgreSQL database.
4. Confirm `GET /api/health` returns `200 ready`.
5. Verify registration, invalid-password handling, GitHub OAuth, Google OAuth, session persistence, logout, and session revocation.
6. Keep sign-in disabled until all checks pass.

The current Preview has built successfully but does not have the database or provider secrets. Do not report it as a working login system.

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
