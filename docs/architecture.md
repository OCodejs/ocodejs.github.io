# OCodeJS Server — Architecture

## System boundary
OCodeJS Server is designed as a control plane for developer services, AI agents, APIs, identity and MCP integrations. GitHub Pages is only the browser interface, not the server runtime.

```text
Browser
  └── OCodeJS Control Center (static Pages frontend)
        └── API Gateway / BFF
              ├── Identity & Access
              ├── Service Registry + Health Checks
              ├── Agent Orchestrator ── Model/provider adapters
              ├── MCP Connection Manager ── Remote MCP servers
              ├── Developer Telemetry
              └── Persistence (SQL + optional cache/queue)
```

This is a target architecture. Components must be implemented and deployed independently before being shown as connected.

## Service boundaries
| Component | Responsibility | Interface |
|---|---|---|
| API Gateway / BFF | Validation, auth enforcement, rate limits, routing, correlation IDs | HTTPS JSON API |
| Identity | Login, OAuth callbacks, sessions, RBAC | OIDC/OAuth + sessions |
| Service registry | Service metadata, health-check policy, deployment references | Registry + health API |
| Agent orchestrator | Agent definitions, run lifecycle, tool policy, provider selection | Agent CRUD + run API |
| MCP manager | Endpoint registration, transport, initialize, tools discovery | MCP client adapter |
| Telemetry | Structured logs, metrics, traces, audit events | OpenTelemetry-compatible |
| Persistence | Durable records and state | PostgreSQL; cache/queue as needed |

Keep provider adapters and protocol-specific code behind service interfaces. Avoid one large Worker or browser-side service implementation.

## Dashboard status contract
Every service status should include: service ID; state (healthy, degraded, unavailable, not_configured, unknown); checkedAt timestamp; latencyMs; version; sanitized message. A URL or saved configuration is not proof of health. Require an authenticated health request.

## Agent lifecycle
Suggested lifecycle: draft → configured → ready → running → succeeded | failed | cancelled. Each run needs a unique ID, actor, agent version, provider adapter, tool permission snapshot, timestamps, bounded execution time, cancellation and sanitized result reference. Never expose provider credentials to the browser or agent prompts.

## MCP lifecycle
1. Validate endpoint scheme/host against SSRF policy.
2. Store credentials server-side; never return secret material.
3. Establish configured transport.
4. Send initialize and negotiate protocol capabilities.
5. Send notifications/initialized when required.
6. Call tools/list and validate tool schemas.
7. Enforce per-connection tool allowlists and user authorization.
8. Record health, latency, protocol version and last successful check.

Registration is not equivalent to a successful handshake; display these states separately.

## Environments and operations
Use isolated development, staging and production environments. Start with staging and a small number of independently deployable services. Keep the Pages site as the public shell. Choose backend deployment only after verifying existing account ownership, runtime, database and secret-management facilities.

Provide separate liveness/readiness checks, explicit upstream timeouts, bounded retries, idempotency for retryable writes, request/trace IDs, audit events, backup/restore procedures and rollback plans.

## Static repository non-goals
This repository must not become the source of truth for accounts, API keys, model credentials, MCP secrets, runtime logs or database records. Keep only frontend assets, public docs and non-sensitive configuration here.
