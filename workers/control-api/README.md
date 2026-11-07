# OCodeJS Control API — Phase 1.2

This Worker is the first read-only backend slice for the OCodeJS Server Control Center.

## Staging deployment

- Worker: `ocodejs-server-api-staging`
- Staging URL: https://ocodejs-server-api-staging.huynhthuongg2505-f9b.workers.dev
- Deployment: uploaded successfully to the OCodeJS Cloudflare account.
- Workers.dev: enabled for this Worker only; preview URLs remain disabled.
- Observability: Workers Logs and Traces enabled; structured JSON request events include request ID, method, normalized path, status and duration. Query strings, request bodies and authorization headers are not logged.
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

Service Registry probes `https://auth.ocodejs.dev/health` for the separate OCodeJS CLI GitHub OAuth/PAT service and performs an MCP `initialize` + `tools/list` handshake against the isolated `ocodejs-mcp-staging` Worker. The MCP probe validates the protocol version and the two-tool read-only allowlist; it does not invoke tools. The Account Portal Auth.js service remains `not_configured`: its source exists in the private `zskbot/mcp.server.auth` repository, but the current `mcp-server-auth` Worker script is a 503 preparation stub and has no verified account-portal runtime. AI runtime and MCP connection manager remain `not_configured`. Telemetry is `degraded`: structured request events are emitted to Workers Logs, but metrics aggregation and a queryable audit store are not configured.

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
5. Verify the CLI Auth health probe and distinguish it from the Account Portal Auth.js backend.
6. Verify the MCP protocol probe reports healthy only after initialize and tools/list both pass.
7. Keep sign-in controls disabled until the account portal has a dedicated Preview runtime, database and OAuth callbacks.

No production routes are attached. This Worker is isolated from existing OCodeJS Worker scripts.

## Structured request telemetry

Every request emits one JSON event to Cloudflare Workers Logs with `event`, `requestId`, HTTP method, normalized URL path, response status, duration in milliseconds and timestamp. The query string, request body, cookies, authorization headers and upstream payloads are deliberately excluded. Responses also return `X-Request-Id` and `Server-Timing` for correlation. This is log-based observability only; it does not provide durable audit records, metric aggregation, alerting or a role-based log explorer.
