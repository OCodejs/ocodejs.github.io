# OCodeJS Git + AutoRun — staging foundation

**Status:** architecture and UI preview only. No Git service, queue, runner, API, or database has been provisioned by this change.

## Product boundary

OCodeJS owns the product experience and control plane. Forgejo is the Git forge engine; do not reimplement Git wire protocol, packfiles, SSH, merge-base, or diff algorithms.

- **Git plane:** Forgejo repositories, users, teams, branch protections, SSH/HTTPS transport, issues and pull requests.
- **Control plane:** Cloudflare Worker API for repository metadata, job admission, queue orchestration, runner registration, status and audit events.
- **Execution plane:** isolated Linux runner hosts. Build commands run inside ephemeral, resource-limited containers; never execute repository code inside a Worker or the control-plane host.
- **Storage plane:** PostgreSQL for durable records; R2 for immutable artifacts and log bundles; Queue for asynchronous job dispatch.
- **Identity:** OCodeJS Auth/OIDC integration. Forgejo OAuth/OIDC integration must be validated against the actual Auth server before enabling SSO.

## Proposed request flow

1. Git push / PR event reaches a signed Forgejo webhook endpoint.
2. API validates signature, event type, repository allowlist and delivery ID.
3. API inserts a job with a unique idempotency key and publishes its ID to Queue.
4. Scheduler enforces per-repository concurrency, quotas, timeout and retry policy.
5. Runner claims a short-lived lease and downloads a read-only source snapshot.
6. Runner creates an ephemeral sandbox, executes the allowlisted workflow steps, and streams bounded logs.
7. Runner uploads artifacts using a short-lived scoped upload URL.
8. API records terminal status and updates the PR check result.
9. Dashboard reads authenticated API data; it never receives runner credentials or storage secrets.

## Initial data model

- users: external OIDC subject, status, created_at.
- teams and team_members: organization membership and role.
- repositories: Forgejo repository ID, owner, slug, visibility, default branch, archived.
- repository_permissions: user/team, repository, role.
- pull_requests: Forgejo PR ID, repository ID, source/target refs, state.
- workflow_definitions: repository, path, version, enabled, policy snapshot.
- jobs: repository, commit SHA, event, idempotency key, state, attempt, timestamps.
- job_leases: job, runner, lease token hash, expiry, heartbeat.
- job_steps: job, step index, command label, state, exit code, duration.
- artifacts: job, object key, size, sha256, content type, expiry.
- audit_events: actor, action, resource, request ID, timestamp, redacted metadata.

## Job state machine

queued → scheduled → leased → running → succeeded | failed | cancelled | timed_out

A lease expiry returns a job to queued only while retry budget remains. Terminal jobs are immutable; retries create a new attempt record. Use compare-and-swap / transactional updates to prevent two runners from owning one job.

## Security requirements

- Never expose Forgejo admin tokens, OIDC client secrets, runner registration tokens, database credentials or R2 credentials in browser code.
- Use OIDC authorization code flow with PKCE for browser sessions; enforce server-side RBAC on every mutation.
- Forgejo webhook signatures, delivery replay protection, payload size limits and repository allowlists are mandatory.
- Runner enrollment is one-time; runner credentials are short-lived, hashed at rest, revocable and scoped to an environment.
- One ephemeral sandbox per job. No host Docker socket in job containers, no privileged mode, no host mounts, no host network, non-root UID, read-only base image, CPU/memory/PID/disk limits, timeout and outbound network policy.
- Treat repository code, workflow YAML, build logs and artifacts as untrusted input. Redact secrets before log persistence; never inject long-lived credentials into build environments.
- Artifact download URLs must be short-lived and scoped to one object. Apply size/type limits, retention and malware scanning policy.
- Audit repository visibility changes, membership changes, token creation/revocation, runner enrollment, job cancellation and artifact access.

## Free-tier and cost controls

Free-first is a design target, not a promise of unlimited compute. Cloudflare can host the control plane and queue; it cannot replace a general-purpose Linux build host for arbitrary npm/Next.js builds. Forgejo and runners need an always-on or on-demand compute host. R2 must be enabled before artifacts can be stored there. Enforce job minutes, concurrency, artifact size and retention quotas.

## Deployment phases

### Phase A — local/staging Git forge
- Start Forgejo + PostgreSQL using infra/autorun/docker-compose.yml.
- Keep public registration disabled; create the initial administrator out of band.
- Set canonical HTTPS URL and SSH endpoint only after DNS/TLS are deliberately configured.
- Configure OIDC only after issuer metadata, callback and logout behavior are verified.
- Import one non-critical repository first; keep GitHub as source of truth until a restore test passes.

### Phase B — control plane
- Provision separate staging D1/Queue bindings or PostgreSQL-backed service after validating account limits and permissions.
- Add webhook ingress, idempotent job records, scheduler, lease/heartbeat and status API.
- Add authentication and RBAC before exposing repository or job mutations.

### Phase C — isolated runner
- Provision a dedicated staging host; verify OS, architecture, available RAM/CPU/disk and Docker/rootless container support.
- Enroll one runner with a short-lived token.
- Run a no-network smoke job, then a controlled npm test/build job.
- Verify timeout, cancellation, lease recovery, disk cleanup and runner revocation.

### Phase D — migration
- Mirror selected repositories from GitHub to Forgejo.
- Compare refs, tags, LFS objects, default branch, protected branches, PRs/issues and release assets.
- Keep bidirectional sync disabled initially; avoid split-brain writes.
- Switch a repository only after restore, auth, clone/push and PR checks pass.

## Release gates

No Production DNS change, no migration of source-of-truth repositories, no public registration and no paid resource creation in this staging foundation. Production cutover requires explicit approval after security review, backup/restore drill and recovery test.
