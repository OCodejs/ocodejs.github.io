# OCodeJS Control API — Phase 1

This Worker is the first read-only backend slice for the OCodeJS Server Control Center.

## Staging deployment

- Worker: `ocodejs-server-api-staging`
- Staging URL: https://ocodejs-server-api-staging.huynhthuongg2505-f9b.workers.dev
- Deployment: uploaded successfully to the OCodeJS Cloudflare account.
- Workers.dev: enabled for this Worker only; preview URLs remain disabled.
- Observability: Workers Logs and Traces enabled; query strings redacted.
- No custom domain, production route, secret, or existing Worker was changed.

The deployment API confirmed the Worker script and its 100% deployment version. Runtime HTTP smoke tests are still pending: the current execution environment could not resolve the workers.dev hostname, so do not treat the endpoint as browser-verified.

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

## Next staging checks

1. Open the staging URL and confirm `/api/v1/health/live` returns HTTP 200.
2. Confirm `/api/v1/health/ready` returns `ready: true`.
3. Confirm `/api/v1/services` marks only `control-api` as healthy.
4. Configure the exact staging Control Center origin in `ALLOWED_ORIGINS` before browser integration.
5. Keep the public dashboard disconnected until those checks pass.

No production routes are attached. This Worker is isolated from existing OCodeJS Worker scripts.
