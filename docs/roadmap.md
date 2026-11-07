# OCodeJS Server — Delivery Roadmap

This roadmap separates the static control center from the multi-service platform. Items are complete only when code, automated tests and the relevant deployment evidence exist.

## Phase 0 — Static control center
- [x] Seven workspace sections.
- [x] Responsive navigation and local preview interactions.
- [x] Clear preview/not-connected labels.
- [x] GitHub Pages workflow succeeded for the merged Control Center commit.
- [ ] Browser visual and assistive-technology verification on desktop and mobile.

## Phase 1 — Technical foundation
- [x] Architecture baseline.
- [x] API contract draft.
- [x] Security baseline.
- [x] Delivery roadmap.
- [x] OpenAPI 3.1 contract for Control API.
- [x] Automated Node test workflow for the Control API.
- [x] Isolated staging Worker with Logs and Traces enabled.
- [x] Environment configuration schema and staging/production deployment runbook.
- [x] Automated local Markdown link checks and static HTML accessibility checks (not a substitute for browser/assistive-technology review).

## Phase 2 — Read-only backend integration
- [x] Implement liveness/readiness and read-only service registry.
- [x] Add request IDs, stable error envelopes and restrictive CORS handling.
- [x] Deploy the isolated staging Control API.
- [x] Add the official GitHub Pages origin to the staging API CORS allowlist.
- [x] Merge Dashboard integration and align the Pages shell with OCode.js CLI theme.
- [ ] Verify browser-side cross-origin requests from GitHub Pages.
- [ ] Add authenticated read-only service status after Account Portal Auth.js is ready.
- [ ] Keep Production disconnected until explicit approval.

## Phase 3 — Identity and access
- [x] Add a read-only health probe for the separate OCodeJS CLI GitHub OAuth/PAT Worker (PR #6; staging deployment updated).
- [x] Document the separation between CLI OAuth and Account Portal Auth.js.
- [x] Build and deploy the Account Portal Auth.js code to an isolated, Access-protected Cloudflare Preview (build success; no database or OAuth secrets configured).
- [ ] Configure a dedicated Preview PostgreSQL database and Google/GitHub OAuth callbacks.
- [ ] Verify registration, login, OAuth callbacks, session persistence and logout end-to-end.
- [ ] Implement server-side RBAC and project/environment scopes.
- [ ] Add CSRF, audit events, session revocation and rate-limit tests.
- [ ] Enable sign-in controls only after the Preview release gate passes.

## Phase 4 — MCP management
- [x] Deploy isolated staging MCP Worker and register its endpoint.
- [x] Implement initialize/capability negotiation and tools/list.
- [x] Add protocol error handling and a fixed read-only tool allowlist.
- [x] Add a read-only MCP connection registry for the fixed staging endpoint; no arbitrary URL or mutation support.
- [x] Expose the versioned Agent Registry through two additional read-only MCP tools; validate agent IDs and keep execution disabled.
- [x] Expose Provider Registry listing and lookup through two additional read-only MCP tools; inference remains disabled.
- [ ] Add authenticated connection management, secret storage and expanded SSRF protections.
- [ ] Complete external browser smoke test; outbound verification is blocked by the integration runner.

## Phase 5 — AI agent operations
- [x] Add a read-only Agent Registry with versioned draft definitions; no model provider or execution enabled.
- [x] Add a read-only Provider Registry catalog; Workers AI remains not configured and inference requires explicit enablement.
- [x] Add a read-only runtime readiness endpoint that reports provider/run-store state and explicitly disables inference and agent execution.
- [ ] Server-side provider adapters.
- [ ] Run lifecycle, cancellation, quotas and usage telemetry.
- [ ] Tool permission snapshots and approval gates.

## Phase 6 — Developer Console and integrations
- [x] Enable persisted Cloudflare Worker logs and traces for staging Control API and MCP Worker (query strings redacted).
- [x] Emit structured Control API request events and correlation headers; keep metric aggregation and queryable audit storage explicitly pending.
- [ ] Centralize application metrics, distributed traces and retention policies.
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

 
## Phase 8 — OCode.js Profile (multi-user)
- [x] Define per-account profile ownership, public route, privacy boundary and product sections.
- [x] Draft public and owner-only Profile API contract.
- [x] Add a responsive static UI preview with explicit sample-data labeling.
- [ ] Verify Account Portal repository access, database ownership, session subject and registration lifecycle.
- [ ] Implement profile schema/migrations and idempotent profile provisioning in the Account Portal.
- [ ] Implement username reservation, public profile reads, owner-only updates and CSRF/RBAC tests.
- [ ] Implement README sanitization, pinned repositories, privacy controls and pagination.
- [ ] Add follows, projects, packages, stars, contribution aggregation and verified activity sources.
- [ ] Connect optional GitHub integration with least-privilege scopes and token revocation.
- [ ] Run end-to-end staging tests and accessibility/browser verification.
- [ ] Production release only after explicit approval.

The preview at `profile/preview.html` is static and uses sample data. It is not an authenticated application, does not persist changes and must not be presented as a live profile service.
