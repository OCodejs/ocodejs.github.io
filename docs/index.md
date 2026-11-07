# OCodeJS Server — Technical Documentation

This repository currently hosts a static GitHub Pages frontend. The architecture and API definitions are implementation proposals, not proof that backend services are running.

## Start here
- [Platform architecture](architecture.md)
- [API contract](api-contract.md)
- [Security baseline](security.md)
- [Delivery roadmap](roadmap.md)

| Area | Responsibility | Current state |
|---|---|---|
| Server Dashboard | Health, uptime, resource and deployment status | UI preview |
| AI Agents | Registry, provider configuration, task execution | Catalog concept |
| API Gateway | Routing, auth, quotas, validation | Contract draft |
| Authentication | Identity, OAuth, sessions, roles | UI preview |
| MCP Server | Endpoint registry, handshake, tool discovery | UI preview |
| Developer Console | Logs, metrics, traces, audit | UI preview |
| Documentation | Technical guides and API references | Initial docs |

## Status vocabulary
- **Verified:** live request to the named service succeeded at the stated time.
- **Configured:** endpoint/credentials exist, but runtime health is not proven.
- **Not connected:** no verified integration is configured.
- **Preview:** local UI-only state; not persisted or sent to a backend.
- **Degraded / Unavailable:** based on a real health check.

The Pages frontend must never contain provider keys, OAuth secrets, database credentials or MCP tokens. Do not display fabricated health metrics.
