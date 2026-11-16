---
layout: null
permalink: /docs/
title: OCodeJS Server — Documentation
---

# OCodeJS Server — Documentation

Technical documentation and entry points for the OCodeJS and Velclaw ecosystem. This page is published through GitHub Pages at [ocodejs.co/docs](http://ocodejs.co/docs/).

## OCodeJS Ecosystem — Live Pages

| Project | Description | Live page |
|---|---|---|
| OCodeJS Docs | Technical documentation and developer guides | [Open Docs](http://ocodejs.co/docs/) |
| OCodeJS | Main website and Control Center | [Open OCodeJS](http://ocodejs.co/) |
| OCodeJS CLI Hub | CLI tools and developer utilities | [Open CLI Hub](http://ocodejs.co/cli-hub/) |
| Ask OCodeJS | AI assistant and Q&A workspace | [Open Ask OCodeJS](https://zskbot.github.io/ask-ocodejs/) |
| VelclawHost | Hosting Control Center and deployment management | [Open VelclawHost](https://velclaw.github.io/VelclawHost/#/overview) |

## Technical Documentation

This repository hosts a static GitHub Pages frontend, a separately deployed Cloudflare staging Control API, and technical documentation. The UI and service registry distinguish live checks from unconfigured integrations.

### Start here
- [Platform architecture](architecture.html)
- [API contract](api-contract.html)
- [Control API staging connection and troubleshooting](control-api-staging.html)
- [Authentication integration status](auth-integration-status.html)
- [Environment configuration](environment-configuration.html)
- [Deployment runbook](deployment-runbook.html)
- [Security baseline](security.html)
- [Delivery roadmap](roadmap.html)

| Area | Responsibility | Current state |
|---|---|---|
| Server Dashboard | Health, uptime, resource and deployment status | Live API integration; each refresh requires a fresh verified snapshot; stale data is cleared on failure |
| AI Agents | Registry, provider configuration, task execution | Read-only Agent/Provider catalogs staged; runtime not configured |
| API Gateway | Routing, auth, quotas, validation | Read-only Control API live on staging |
| Authentication | Identity, OAuth, sessions, roles | CLI OAuth health probe integrated; Account Auth Preview build succeeded, but DB/provider secrets and E2E auth remain pending |
| MCP Server | Endpoint registry, handshake, tool discovery | Staging handshake and six fixed read-only tools deployed; external smoke test pending |
| Developer Console | Logs, metrics, traces, audit | Cloudflare Logs/Traces enabled for staging Control API and MCP Worker; centralized app telemetry not integrated |
| Documentation | Technical guides and API references | Initial docs |

### Status vocabulary
- **Verified:** live request to the named service succeeded at the stated time.
- **Configured:** endpoint/credentials exist, but runtime health is not proven.
- **Not connected:** no verified integration is configured.
- **Preview:** local UI-only state; not persisted or sent to a backend.
- **Degraded / Unavailable:** based on a real health check.

The Pages frontend must never contain provider keys, OAuth secrets, database credentials or MCP tokens. Do not display fabricated health metrics.
