# OCodeJS Server — Full Source Code Audit & Next Delivery Plan

> Audit date: 2026-11-11  
> Repository: `OCodejs/ocodejs.github.io`  
> Domain scope: `ocodejs.co` and OCodeJS services only  
> Delivery policy: branch + PR; staging/Preview first; no automatic merge or Production deployment.

## 1. Executive summary

The repository is a working **static control-center frontend plus a set of separately deployed staging Workers and technical documentation**. It is not yet a complete full-stack control plane. Several pages are functional as read-only dashboards or previews, while identity, persistence, agent execution, provider inference, centralized observability and production operations remain incomplete.

The current GitHub Pages source contains:
- A single-page Control Center in `index.html`.
- Shared theme/design-system CSS.
- A Project Registry and JSON repository catalog.
- Separate Auth and Profile preview pages.
- Control API and MCP Worker source, tests and deployment documentation.
- Token Vault source, SQL schema, tests and a small credential UI.
- GitHub Actions checks for API, MCP, registry, token-vault and ecosystem synchronization.

The roadmap must distinguish **implemented source**, **deployed staging service**, **live verified runtime**, and **static preview**. A page or Worker existing in Git is not proof that the connected service is healthy.

## 2. Repository inventory

### Root and frontend
| Path | Purpose | Audit status |
|---|---|---|
| `index.html` | Main Server Control Center SPA | Present; 10 navigation destinations are registered |
| `ocodejs-design-system.css` | Shared design tokens/components | Present |
| `ocodejs-pages-theme.css` | GitHub Pages theme | Present |
| `projects/index.html` | Project Registry UI | Present; verify registry loading, filtering and sync status in browser |
| `auth/index.html` | Auth UI/portal preview | Present; not proof of working end-to-end authentication |
| `profile/preview.html` | Profile UI preview | Static sample-data preview; no durable account persistence |
| `projects.registry.json` | Ecosystem repository registry and sync policy | Present; requires repository-by-repository ownership and scope review |
| `llms-full.txt` | LLM-facing documentation index/content | Present; keep synchronized with canonical docs |
| `CNAME` | GitHub Pages custom-domain declaration | Present; DNS/TLS must be checked independently |

### Backend and security source
| Path | Purpose | Audit status |
|---|---|---|
| `workers/control-api/worker.mjs` | Read-only Control API | Source and tests present; staging runtime must be verified via the current custom hostname |
| `workers/control-api/telemetry.mjs` | Structured request telemetry | Source and tests present; central queryable analytics/audit UI is still pending |
| `workers/mcp-server/worker.mjs` | Staging MCP server | Source and tests present; external protocol smoke still needs confirmation |
| `security/token-vault/src/worker.js` | Token Vault Worker | Source present; review live binding, identity enforcement and rotation workflows |
| `security/token-vault/schema.sql` | Token Vault data schema | Present; production-grade data lifecycle and audit verification remain |
| `scripts/` | Static, registry, API, MCP, accessibility and link checks | Present; CI green status must be checked per latest commit |

### Documentation already present
- `docs/architecture.md`
- `docs/api-contract.md`
- `docs/openapi.yaml`
- `docs/control-api-staging.md`
- `docs/auth-integration-status.md`
- `docs/environment-configuration.md`
- `docs/deployment-runbook.md`
- `docs/security.md`
- `docs/incident-response.md`
- `docs/observability-operations.md`
- `docs/profile-system.md`
- `docs/profile-api-contract.md`
- `docs/ecosystem-registry.md`
- `docs/roadmap.md`
- `docs/ui-framework.md`

## 3. Current dashboard page map

The SPA navigation registry in `index.html` currently contains 10 destinations.

### Workspace — 7 pages
1. **Server Dashboard** (`overview`) — service health summary and refresh.
2. **AI Agents** (`agents`) — agent catalog/readiness; execution is not enabled.
3. **API Gateway** (`api`) — API endpoint and gateway information; current Control API is read-only.
4. **Authentication** (`auth`) — CLI Auth health and Account Portal integration status; not a completed sign-in system.
5. **MCP Server** (`mcp`) — MCP endpoint, initialize and tool-discovery status; external smoke verification remains.
6. **Developer Console** (`console`) — logs/metrics/traces/audit direction; centralized queryable telemetry is incomplete.
7. **Documentation** (`docs`) — technical documentation index.

### Platform — 3 pages
8. **Service Registry** (`service-registry`) — service inventory and health states.
9. **Provider Registry** (`providers`) — provider catalog; inference and secret-backed configuration remain disabled.
10. **AI Runtime** (`runtime`) — runtime readiness; agent execution and model inference remain disabled.

### Separate pages
- **Project Registry**: `/projects/`
- **Authentication Portal**: `/auth/`
- **Profile Preview**: `/profile/preview.html`

The three separate pages are not yet a unified authenticated multi-page application. The main dashboard is still a static GitHub Pages frontend.

## 4. Confirmed gaps and blockers

### P0 — Security and service correctness

#### P0.1 Public repository contains a tracked environment file
The public repository tree includes `.env.local`. A metadata-only inspection found non-empty values for:
- `QSTASH_CURRENT_SIGNING_KEY`
- `QSTASH_NEXT_SIGNING_KEY`
- `QSTASH_TOKEN`
- `QSTASH_URL`

**No credential values are reproduced in this document.** Treat the signing keys and token as exposed until proven otherwise.

Required actions:
1. Revoke/rotate the affected QStash credentials in the provider dashboard.
2. Replace any dependent runtime configuration through the approved secret manager.
3. Remove `.env.local` from Git tracking and add local environment files to `.gitignore`.
4. Assess and clean Git history using a coordinated repository-history rewrite only after backup and explicit approval; a normal delete commit does not remove historical copies.
5. Run secret scanning across all branches, PRs, artifacts and deployment logs.
6. Verify the old credentials no longer work.

Do not paste the values into chat, issues, PR descriptions or source code. This audit does not rotate credentials or rewrite Git history.

#### P0.2 Control API hostname mismatch
The dashboard source currently uses the historical `workers.dev` API hostname. The staging Worker is now attached to `api-staging.ocodejs.co`, while the earlier `workers.dev` smoke test failed DNS resolution.

Required actions:
1. Test `https://api-staging.ocodejs.co/api/v1/health/live`.
2. Test `/api/v1/health/ready` and `/api/v1/services`.
3. Test CORS preflight from the exact origin `https://ocodejs.co`.
4. Verify fresh `checkedAt`, response schema, request IDs and no-store behavior.
5. Only after those checks pass, update the frontend API base URL and matching docs on a feature branch.
6. Keep dashboard status UNVERIFIED when any check fails. Never reuse stale snapshots or default a failed request to healthy.

The custom hostname attachment is not itself evidence that the runtime endpoint is healthy.

#### P0.3 Environment and deployment boundary
Cloudflare Worker Domain metadata has reported the `production` environment label for mappings whose Worker service names include `staging`. Investigate the actual script environment/version and deployment target before describing these mappings as isolated staging. Do not change or deploy any Worker environment as part of this documentation task.

### P1 — Identity, account and data persistence

#### Authentication / Account Portal
- Dedicated Preview PostgreSQL database is not configured.
- Preview environment variables and OAuth credentials are not configured.
- GitHub and Google callback flows have not been verified end-to-end.
- Registration, login, session persistence, logout and revocation need automated browser tests.
- Server-side RBAC, project/environment scopes, CSRF protections, rate limits and audit events remain incomplete.
- Keep sign-in disabled until the Preview release gate passes.

#### OCode.js Profile
- Current `profile/preview.html` is static and uses sample data.
- No authenticated profile provisioning or durable profile database is connected.
- Username reservation, public profile reads, owner-only updates and privacy controls remain.
- GitHub README sanitization, pinned repositories, pagination and verified activity ingestion remain.
- Follows, projects, packages, stars and contribution aggregation remain future modules.

### P1 — MCP and AI runtime

#### MCP Server
- Keep the fixed staging endpoint and read-only allowlist until protocol and security checks pass.
- Complete external `initialize`, initialized notification and `tools/list` smoke tests.
- Add authenticated connection management only after secret storage, SSRF protections, redirect/DNS revalidation and permission boundaries are implemented.
- Do not enable arbitrary caller-supplied MCP URLs or mutation tools without a security review.

#### AI Agents
- Agent definitions/catalog are read-only.
- Missing: server-side agent execution, run lifecycle, cancellation, retries, quotas, approval gates, tool permission snapshots and usage records.
- Add execution only after identity, authorization and cost controls are ready.

#### Provider Registry / AI Runtime
- Provider catalog exists, but credentials and inference are not configured.
- Missing: secure provider credential management, model catalog verification, quota/cost budgets, fallback policy, rate limiting and provider health probes.
- Keep inference disabled until explicit model/provider and cost approval.

### P2 — Operations and observability
- Worker Logs/Traces are enabled for staging services according to project docs.
- Centralized metrics, distributed trace correlation, queryable audit storage, retention policies and alert rules remain pending.
- Developer Console needs filters, time ranges, service/environment selection, request correlation and safe redaction.
- Add incident timeline, alert acknowledgement and runbook links only when backed by real persisted data.
- Define SLOs and thresholds from measured staging baselines; do not display invented uptime or history.

### P2 — Frontend verification and consistency
- Verify all 10 navigation destinations on iPhone Safari and desktop.
- Verify keyboard navigation, screen-reader labels, focus management, contrast and reduced-motion behavior.
- Verify every dashboard status has a source, timestamp and explicit state.
- Remove or label all local demo/sample data so it cannot be confused with live API data.
- Reconcile README and docs status with the current main branch and actual staging runtime.
- Keep the OCode.js visual system consistent: dark/minimal, JetBrains Mono-style typography, thin borders, and perfectly square controls (no rounded corners).

## 5. Pages to build next

The following are proposed next pages, not claims that they already exist.

| Priority | Page / route proposal | Required scope | Dependency |
|---|---|---|---|
| P0 | **Control API Connection & Diagnostics** (inside Server Dashboard) | Live liveness/readiness, CORS, DNS, latency, checkedAt, request ID, error detail and retry; explicit UNVERIFIED state | Verify `api-staging.ocodejs.co` first |
| P0 | **Security & Secrets Status** | Secret inventory metadata, rotation status, exposure incident checklist, audit trail; never reveal secret values | Rotate exposed QStash credentials first |
| P1 | **Account Portal — Sign in / Register / Recovery** | GitHub/Google OAuth, email/password, session management, logout and recovery | Preview DB + OAuth + Auth.js E2E |
| P1 | **Roles & Access Control** | Users, roles, project/environment scopes, invitations, session revocation | Auth + RBAC backend |
| P1 | **MCP Connection Manager** | Registered endpoints, handshake state, capabilities, tools/resources/prompts, auth metadata and connection test | MCP E2E + SSRF/security controls |
| P1 | **Agent Catalog & Agent Detail** | Search/filter, version history, permissions, configuration and draft/publish state | Agent Registry API |
| P1 | **Agent Runs & Approvals** | Run queue, live status, logs, cancel/retry, human approval, usage/cost | Auth, orchestration, quotas and audit |
| P1 | **Provider & Model Management** | Provider health, model catalog, credential metadata, limits, budgets and fallback | Secret manager + provider adapters |
| P1 | **Profile — Public & Owner Settings** | Public profile, edit profile, privacy, pinned repos, verified GitHub activity | Profile API + database |
| P2 | **Observability Explorer** | Logs, metrics, traces, filters, time range and request correlation | Central telemetry storage/query |
| P2 | **Audit Log & Alert Center** | Immutable security events, alert rules, acknowledgement, incident links | Durable audit and alert pipeline |
| P2 | **Environment & Deployment Management** | Preview/staging inventory, deployment history, approvals, rollback metadata | Provider adapters + explicit release gates |
| P2 | **Project Registry Detail** | Repository detail, sync eligibility, last check, PR link, errors and ownership | Registry validation + sync API |
| P2 | **Documentation Portal** | Searchable docs, API reference, changelog, troubleshooting and versioned guides | Docs navigation/index generation |
| P2 | **System Status / 404 / Maintenance** | Honest service-wide status, useful not-found and maintenance states | Real status source and route handling |

## 6. Recommended delivery order

### Sprint 0 — Security and API truth
1. Rotate the exposed QStash signing keys/token.
2. Remove tracked `.env.local`, add ignore rules and assess Git history exposure.
3. Verify the new staging API hostname and CORS.
4. Update API base URL and troubleshooting docs only after runtime checks pass.
5. Confirm dashboard never shows stale or fabricated Healthy states.

**Exit criteria:** old credentials revoked; secret scan clean; staging liveness/readiness/services and browser CORS pass; failed checks remain UNVERIFIED.

### Sprint 1 — Identity and Profile
1. Provision dedicated Preview database and Preview-only Auth.js configuration.
2. Complete OAuth/email sign-in, sessions, logout and recovery tests.
3. Implement RBAC, project scopes, CSRF and session revocation.
4. Connect Profile API and durable profile schema.
5. Build public profile and owner settings pages.

**Exit criteria:** automated end-to-end tests pass in Preview; no Production credentials/data reused.

### Sprint 2 — MCP and AI operations
1. Complete MCP external protocol smoke tests.
2. Add secure MCP connection registration and SSRF protections.
3. Build Agent detail and run/approval pages.
4. Build provider/model management with secret metadata and cost limits.
5. Enable inference/execution only after explicit approval and test evidence.

**Exit criteria:** every run and tool call is authenticated, authorized, rate-limited, auditable and cancellable.

### Sprint 3 — Developer operations
1. Centralize logs, metrics and traces.
2. Build Observability Explorer and Audit Log.
3. Add Alert Center and incident runbooks.
4. Add Environment/Deployment management with approval gates.
5. Complete mobile, accessibility, failure-injection and recovery testing.

**Exit criteria:** real telemetry is persisted and queryable; alerts are tested; rollback and recovery are documented.

## 7. Source-code quality and CI requirements

For every implementation PR:
- Preserve the existing architecture; avoid replacing working files with mock pages.
- Add tests for API contracts, state transitions, authorization and error paths.
- Run the repository's existing Node checks for Control API, MCP, registry, Token Vault, accessibility and documentation links.
- Add browser E2E tests for iPhone-sized viewport and desktop.
- Run dependency and secret scanning.
- Ensure all status displays include source, environment, checkedAt and version where applicable.
- Do not commit `.env.local`, credentials, database URLs, OAuth secrets or tokens.
- Use one feature branch and one reviewable PR per cohesive delivery.
- Keep Production disconnected until separately approved.

## 8. Existing GitHub review state

- Default branch: `main`.
- PR #36, “fix(staging): point Control Center at OCodejs Cloudflare Worker”, is merged into `main`.
- PR #8, “feat(auth): integrate CLI Auth readiness into Control API main”, remains open and needs a separate review of its checks and staging evidence.
- The roadmap and README should be reconciled after the current API hostname is verified.
- No merge is authorized by this document.

## 9. Scope and exclusions

This plan covers only the OCodeJS control-plane source and OCodeJS services intended for `ocodejs.co`.

- Do not attach AnhThu or Thu365 services to `ocodejs.co`.
- Do not delete or rewrite those separate projects as part of this plan.
- Do not change `ocodejs.dev` or any unrelated domain.
- Do not change DNS, Worker bindings, Production deployments, databases or secrets without a separate approved implementation task.
- The presence of an entry in `projects.registry.json` is not permission to attach a domain or deploy that repository.

## 10. Definition of Done

A page or service is **Done** only when:
1. Source code is implemented, not a static placeholder.
2. API contract and authorization are documented.
3. Tests cover success, failure, stale data and permission denial.
4. The relevant Preview/staging deployment is verified end-to-end.
5. Logs/metrics/audit behavior is real and safely redacted.
6. Mobile and accessibility checks pass.
7. Documentation, README, registry and navigation agree.
8. Production remains untouched unless separately approved.

---
*This document is an audit and delivery plan. It does not certify that any unverified runtime is healthy, and it does not authorize production changes.*
