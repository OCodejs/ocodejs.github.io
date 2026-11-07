# OCodeJS Server — API Contract (Draft)

Proposed contract only. Routes are not live until an API service is implemented and deployed.

Base path: /api/v1

## Conventions
- HTTPS outside local development; JSON bodies.
- Secure session cookie for browser control-plane calls; scoped bearer/API tokens for machine clients.
- Include requestId in every response and the `X-Request-Id` response header; timestamps use ISO-8601 UTC. The Control API also returns `Server-Timing` and emits structured request logs without query strings, bodies, cookies or authorization headers.
- Cursor pagination; Idempotency-Key for retryable mutations.
- Stable machine-readable error codes. Never return stack traces or secrets.

## Health and service registry
| Method | Path | Purpose |
|---|---|---|
| GET | /health/live | Process liveness |
| GET | /health/ready | Readiness including required dependencies |
| GET | /services | List registered services and sanitized status |
| GET | /services/{serviceId} | Service metadata and latest check |
| POST | /services/{serviceId}/checks | Request authorized health check |

Example health response:
```json
{
  "service": "agent-runtime",
  "state": "not_configured",
  "checkedAt": null,
  "latencyMs": null,
  "version": null,
  "message": "No runtime endpoint configured",
  "requestId": "req_example"
}
```

## AI Agents
| Method | Path | Purpose |
|---|---|---|
| GET | /agents | List agent definitions |
| POST | /agents | Create agent definition |
| GET | /agents/{agentId} | Read agent metadata |
| PATCH | /agents/{agentId} | Update definition |
| POST | /agents/{agentId}/runs | Start a run |
| GET | /runs/{runId} | Read run state and sanitized output |
| POST | /runs/{runId}/cancel | Cancel a run |

Check tool permissions server-side on every invocation.

## MCP connections
| Method | Path | Purpose |
|---|---|---|
| GET | /mcp/connections | List connections without secrets |
| POST | /mcp/connections | Register connection |
| GET | /mcp/connections/{connectionId} | Read metadata |
| POST | /mcp/connections/{connectionId}/connect | Connect and initialize |
| POST | /mcp/connections/{connectionId}/discover | Refresh tool metadata |
| DELETE | /mcp/connections/{connectionId} | Remove connection |

Never expose stored credentials. Validate destination hosts and resolved IPs to mitigate SSRF, including redirects and DNS rebinding.

## Identity and telemetry
The current Account Portal Auth.js runtime is not configured. The separate OCodeJS CLI GitHub OAuth/PAT service is health-probed through the service registry; that probe is not an account login session. The staging MCP server is probed with `initialize` and `tools/list`; the probe does not invoke tools.

| Method | Path | Purpose |
|---|---|---|
| GET | /services/cli-auth | Read-only health snapshot for the CLI GitHub OAuth/PAT Worker |
| GET | /services/identity | Read-only status for the Account Portal Auth.js integration |
| GET | /services/mcp-server | Read-only MCP initialize/tools/list protocol probe |
| GET | /auth/session | Read current session |
| POST | /auth/logout | End session |
| GET | /account | Read account profile |
| GET | /account/sessions | List sessions |
| DELETE | /account/sessions/{sessionId} | Revoke session |
| GET | /observability/logs | Query authorized logs |
| GET | /observability/metrics | Read metric summaries |
| GET | /observability/traces/{traceId} | Read trace summary |
| GET | /audit/events | Query audit events |

## Error envelope
```json
{
  "error": {
    "code": "SERVICE_NOT_CONFIGURED",
    "message": "The requested service is not configured.",
    "details": null
  },
  "requestId": "req_example"
}
```

Suggested codes: UNAUTHENTICATED, FORBIDDEN, NOT_FOUND, VALIDATION_ERROR, RATE_LIMITED, SERVICE_NOT_CONFIGURED, UPSTREAM_TIMEOUT, UPSTREAM_UNAVAILABLE, INTERNAL_ERROR.

Publish an OpenAPI 3.1 document from the implemented server as the source of truth. Reconcile this draft against it before client integration.
