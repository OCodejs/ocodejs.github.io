# OCodeJS Git staging — local bootstrap

This compose file is a **local staging bootstrap**, not a production deployment.

## Requirements

- Docker Engine + Docker Compose v2.
- A dedicated host with current security updates.
- A strong database password stored in the host secret manager or shell environment. Never commit it.
- Inbound access remains loopback-only (127.0.0.1) until a reverse proxy, HTTPS, SSH exposure and firewall rules have been reviewed.

## Start

1. Set FORGEJO_DB_PASSWORD in the host environment using a randomly generated value.
2. Run docker compose -f infra/autorun/docker-compose.yml config and inspect the rendered configuration.
3. Run docker compose -f infra/autorun/docker-compose.yml up -d.
4. Open http://127.0.0.1:3000 from the host or through a secure SSH tunnel.
5. Complete the Forgejo install wizard only after confirming PostgreSQL connection settings. Create the first administrator; keep registration disabled.
6. Verify backup/restore before importing any important repository.

## GitHub Actions AutoRun reporting

The Cloudflare staging Control API uses one GitHub Actions workflow:
`.github/workflows/autorun-control-api-tests.yml`.

- Pull requests run the Node.js test suite only. They do not receive OIDC write permission and do not write to staging.
- A push to `main` runs the same test suite, then a dependent report job publishes the completed result directly to the staging Control API.
- The report job is the only job with `id-token: write`; it does not check out or execute repository code.
- The Worker validates the GitHub OIDC signature, issuer, audience, repository name and ID, exact workflow ref, `push` event, `main` ref, and run ID/attempt before accepting the payload.
- The Worker writes the run and event records in one D1 batch. Repeated reports for the same run attempt are idempotent.
- There is no `workflow_run` bridge workflow.

The Worker trust settings must match:
- `ALLOWED_REPOSITORY=OCodejs/ocodejs.github.io`
- `ALLOWED_REPOSITORY_ID=1449322239`
- `ALLOWED_WORKFLOW_REF=OCodejs/ocodejs.github.io/.github/workflows/autorun-control-api-tests.yml@refs/heads/main`

PR test results are visible in GitHub Actions. Only trusted main-branch runs are mirrored into the staging D1 database. Staging HTTP and D1 read-back verification must be performed after the Worker deployment and the existing D1 schema is confirmed; do not create a replacement database or write synthetic records.

## Not included

- No Cloudflare tunnel, DNS record, public ingress or production deployment.
- No runner service. A runner must be deployed separately with per-job isolation and a dedicated host; do not mount the host Docker socket into untrusted job containers.
- No OAuth/OIDC credentials or webhook secrets.
- No automatic import, mirror or migration from GitHub.

## Recovery

Back up both forgejo-data and forgejo-postgres consistently. Test restoring to a separate isolated host and verify clone/fetch/push, SSH key auth, branch protection, PR metadata and LFS if enabled. A volume snapshot alone is not a verified restore.
