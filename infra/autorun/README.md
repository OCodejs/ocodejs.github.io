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

## Not included

- No Cloudflare tunnel, DNS record, public ingress or production deployment.
- No runner service. A runner must be deployed separately with per-job isolation and a dedicated host; do not mount the host Docker socket into untrusted job containers.
- No OAuth/OIDC credentials or webhook secrets.
- No automatic import, mirror or migration from GitHub.

## Recovery

Back up both forgejo-data and forgejo-postgres consistently. Test restoring to a separate isolated host and verify clone/fetch/push, SSH key auth, branch protection, PR metadata and LFS if enabled. A volume snapshot alone is not a verified restore.
