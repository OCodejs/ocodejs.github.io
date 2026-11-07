# OCodeJS Server — Delivery Roadmap

This roadmap separates the static control center from the multi-service platform. Items are complete only when code, automated tests and the relevant deployment evidence exist.

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
- [x] OpenAPI 3.1 contract for Control API.
- [x] Automated Node test workflow for the Control API.
- [x] Isolated staging Worker with Logs and Traces enabled.
- [ ] Environment configuration schema and deployment runbook.
- [ ] Automated link checking and accessibility checks.

## Phase 2 — Read-only backend integration
- [x] Implement liveness/readiness and read-only service registry.
- [x] Add request IDs, stable error envelopes and restrictive CORS handling.
- [x] Deploy the isolated staging Control API.
- [x] Add the official GitHub Pages origin to the staging API CORS allowlist.
- [ ] Merge PR #5 and verify browser-side cross-origin requests from GitHub Pages.
- [ ] Add authenticated read-only service status after Account Portal Auth.js is ready.
- [ ] Keep Production disconnected until explicit approval.

## Phase 3 — Identity and access
- [x] Add a read-only health probe for the separate OCodeJS CLI GitHub OAuth/PAT Worker (PR #6; staging deployment updated).
- [x] Document the separation between CLI OAuth and Account Portal Auth.js.
- [ ] Deploy Account Portal Auth.js to an isolated Preview runtime.
- [ ] Configure a dedicated Preview PostgreSQL database and Google/GitHub OAuth callbacks.
- [ ] Verify registration, login, OAuth callbacks, session persistence and logout end-to-end.
- [ ] Implement server-side RBAC and project/environment scopes.
- [ ] Add CSRF, audit events, session revocation and rate-limit tests.
- [ ] Enable sign-in controls only after the Preview release gate passes.

## Phase 4 — MCP management
- [x] Register an isolated staging MCP endpoint and probe its protocol handshake from the Control API.
- [ ] Add persistent MCP connection registration and management endpoints.
- [x] Implement initialize/capability negotiation and tools/list on the staging MCP Worker.
- [x] Verify initialize and tools/list contract with automated Control API probe tests.
- [ ] Add server-side secret storage, SSRF protection and tool allowlists.
- [x] Add read-only protocol health reporting with healthy/unknown/unavailable states.
- [ ] Add authenticated connection health and protocol error telemetry.

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
