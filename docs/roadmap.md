# OCodeJS Server — Delivery Roadmap

This roadmap separates a static control center from a real multi-service platform. Items are proposals until implemented, tested and deployed.

## Phase 0 — Static control center
- [x] Seven workspace sections.
- [x] Responsive navigation and local preview interactions.
- [x] Clear preview/not-connected labels.
- [x] GitHub Pages workflow succeeded for the merged Control Center commit.
- [ ] Browser visual and accessibility verification on desktop and mobile.

## Phase 1 — Technical foundation
- [x] Architecture baseline.
- [x] API contract draft.
- [x] Security baseline.
- [x] Delivery roadmap.
- [ ] OpenAPI 3.1 generated from the first implemented backend.
- [ ] Environment configuration schema and deployment runbook.
- [ ] Automated lint, HTML validation, link checking and accessibility checks.

## Phase 2 — Read-only backend integration
- [ ] Choose and verify the authoritative API gateway endpoint.
- [ ] Implement liveness/readiness and service registry.
- [ ] Add authenticated read-only service status to dashboard.
- [ ] Add request IDs, safe errors and timeouts.
- [ ] Verify staging integration; do not connect production by default.

## Phase 3 — Identity and access
- [ ] Integrate selected OIDC/Auth service.
- [ ] Add account profile, session list and logout.
- [ ] Implement server-side RBAC and project/environment scopes.
- [ ] Add CSRF, audit events and session revocation tests.

## Phase 4 — MCP management
- [ ] Register and validate MCP endpoints.
- [ ] Implement initialize/capability negotiation and tools/list.
- [ ] Add server-side secret storage, SSRF protection and tool allowlists.
- [ ] Add connection health and protocol error reporting.

## Phase 5 — AI agent operations
- [ ] Agent registry and versioned definitions.
- [ ] Server-side provider adapters.
- [ ] Run lifecycle, cancellation, quotas and usage telemetry.
- [ ] Tool permission snapshots and approval gates.

## Phase 6 — Developer Console and integrations
- [ ] Structured logs, metrics, distributed traces.
- [ ] Role-based audit event explorer.
- [ ] GitHub, Cloudflare and Vercel status adapters with least-privilege access.
- [ ] Alert rules, retention policies and incident playbooks.

## Phase 7 — Production readiness
- [ ] Threat model and independent security review.
- [ ] Load, failure-injection and recovery tests.
- [ ] Backup and restore drill.
- [ ] SLOs, alert thresholds, operational ownership and rollback procedure.
- [ ] Explicit production approval before any production deployment.

## Release gate
A feature is not complete because its UI exists. Mark it Done only after backend implementation, automated tests, authorization checks, operational telemetry and user-visible error states are verified. Keep staging and production credentials/data isolated.
