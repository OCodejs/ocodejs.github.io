# AutoRun durable queue — staging change set

This branch extends the existing Worker and D1. It does not create replacement infrastructure.

## Current resources (read-only discovery)

- Worker: `ocodejs-autorun-control-staging`
- Endpoint: `https://ocodejs-autorun-control-staging.ocodejs-df1.workers.dev`
- D1: `ocodejs-autorun-staging`
- Existing reporting tables: `autorun_runs`, `autorun_events`
- New migration proposal: `infra/autorun/migrations/0002_durable_queue.sql`

The migration is intentionally **not applied** by this PR. It must be reviewed and tested against an isolated D1 preview before staging writes are enabled.

## Durable state

`autorun_jobs` is the authoritative queue. Each row stores an idempotency key, repository/branch/full commit SHA, allowlisted command IDs, attempt budget, availability time, lease owner/token hash/expiry, heartbeat, cancellation request, result and terminal state.

`autorun_job_events` is append-only. SQLite triggers record enqueue, status transitions and cooperative cancellation requests.

The claim path uses one conditional `UPDATE ... WHERE job_id=(SELECT ... LIMIT 1) AND status='queued' RETURNING ...`. The compare-and-swap happens in D1, not in the AutoRun process. Lease tokens are returned once to the runner; only their SHA-256 hash is stored.

## API and security

All `/api/v1/autorun/queue/*` routes require a Bearer token whose SHA-256 digest matches the Worker secret `AUTORUN_RUNNER_TOKEN_SHA256`. The Worker also requires an exact `ALLOWED_JOB_REPOSITORIES` allowlist and `ALLOWED_COMMAND_IDS`.

Routes:
- `POST /jobs`: idempotent admission.
- `POST /claim`: atomic lease acquisition and expired-lease recovery.
- `POST /heartbeat`: lease renewal and cancellation polling.
- `POST /start`: leased → running.
- `POST /complete`: success, failure, timeout, bounded retry/backoff or cancellation.
- `POST /cancel`: immediate cancel for queued/leased jobs; cooperative cancel for running jobs.
- `GET /jobs` and `GET /events`: durable status and audit history.

The old GitHub OIDC event ingestion remains separate. It continues to record trusted GitHub Actions workflow snapshots; it is not the runner queue.

## Release gates

1. Run the Node tests against the real SQLite migration adapter in CI.
2. Confirm concurrent claim, idempotency, lease recovery, retry budget, timeout and cancellation tests pass.
3. Review D1 migration plan and verify it on an isolated database; do not apply to the existing staging database until approved.
4. Configure `AUTORUN_RUNNER_TOKEN_SHA256` only after a matching secret is placed in the AutoRun runner secret manager.
5. Deploy Worker and apply migration only after the test suite passes and a rollback/backup path is confirmed.
6. Connect `OCodejs/mcp.auth.ocodejs` only after the isolated Docker runner host passes its security acceptance tests.

No Worker deployment, D1 migration, secret write, runner enrollment, job dispatch, Production change, DNS change or merge is included in this branch.
