# OCodeJS Control API — Phase 1

This Worker is the first read-only backend slice for the OCodeJS Server Control Center.

## Implemented routes

| Method | Route | Behavior |
|---|---|---|
| GET | `/api/v1` | API metadata and route index |
| GET | `/api/v1/health/live` | Confirms this Worker process can respond |
| GET | `/api/v1/health/ready` | Confirms this stateless API slice is ready |
| GET | `/api/v1/services` | Lists service states without exposing credentials |
| GET | `/api/v1/services/{serviceId}` | Reads one registered service |

Only the Control API reports `healthy`. Identity, AI runtime, MCP manager and telemetry remain `not_configured` until real health adapters are implemented and verified. The existence of another Worker in the account is not treated as proof that it is integrated or healthy.

## Local tests

Requires Node.js 20 or later. No third-party package is required.

```sh
node --test workers/control-api/worker.test.mjs
```

## Staging deployment requirements

- Use a separate Worker named `ocodejs-server-api-staging`.
- Do not attach production routes or replace existing Worker scripts.
- Configure `ALLOWED_ORIGINS` with the exact staging Control Center origin(s).
- Do not add credentials or secrets to source control.
- Verify `/api/v1/health/live`, `/api/v1/health/ready`, and `/api/v1/services` over HTTPS after deployment.
- Keep the API disconnected from the public dashboard until staging checks pass.

Deployment is intentionally not performed by this source change. The Cloudflare account currently contains existing OCodeJS Workers; staging deployment must be a separate, explicit operation with isolated naming and no production route changes.
