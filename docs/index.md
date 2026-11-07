# OCodeJS Server — Technical Documentation

This repository hosts a static GitHub Pages frontend, a separately deployed Cloudflare staging Control API, and technical documentation. The UI and service registry distinguish live checks from unconfigured integrations.

## Start here
- [Platform architecture](architecture.md)
- [API contract](api-contract.md)
- [Authentication integration status](auth-integration-status.md)
- [Security baseline](security.md)
- [Delivery roadmap](roadmap.md)

| Area | Responsibility | Current state |
|---|---|---|
| Server Dashboard | Health, uptime, resource and deployment status | Live API integration in PR #5; browser verification pending |
| AI Agents | Registry, provider configuration, task execution | Catalog concept; runtime not configured |
| API Gateway | Routing, auth, quotas, validation | Read-only Control API live on staging |
| Authentication | Identity, OAuth, sessions, roles | CLI OAuth health probe in PR #6; Account Portal Auth.js not configured |
| MCP Server | Endpoint registry, handshake, tool discovery | Not connected |
| Developer Console | Logs, metrics, traces, audit | Worker Logs/Traces enabled for Control API; application telemetry not integrated |
| Documentation | Technical guides and API references | Initial docs |

## Status vocabulary
- **Verified:** live request to the named service succeeded at the stated time.
- **Configured:** endpoint/credentials exist, but runtime health is not proven.
- **Not connected:** no verified integration is configured.
- **Preview:** local UI-only state; not persisted or sent to a backend.
- **Degraded / Unavailable:** based on a real health check.

The Pages frontend must never contain provider keys, OAuth secrets, database credentials or MCP tokens. Do not display fabricated health metrics.
