# OCodeJS Server

OCodeJS Server Control Center and public technical documentation.

- **Live frontend:** https://ocodejs.github.io/
- **Control Center source:** [index.html](index.html)
- **Project Registry:** [projects/](projects/index.html) · [registry JSON](projects.registry.json)
- **OCode.js Profile spec:** [multi-user architecture](docs/profile-system.md) · [API contract](docs/profile-api-contract.md) · [UI preview](profile/preview.html)
- **Ecosystem sync architecture:** [docs/ecosystem-registry.md](docs/ecosystem-registry.md)
- **Technical documentation:** [docs/](docs/index.md)
- **Architecture:** [docs/architecture.md](docs/architecture.md)
- **API contract:** [docs/api-contract.md](docs/api-contract.md)
- **Authentication integration status:** [docs/auth-integration-status.md](docs/auth-integration-status.md)
- **Environment configuration:** [docs/environment-configuration.md](docs/environment-configuration.md)
- **Deployment runbook:** [docs/deployment-runbook.md](docs/deployment-runbook.md)
- **Security baseline:** [docs/security.md](docs/security.md)
- **Delivery roadmap:** [docs/roadmap.md](docs/roadmap.md)

## Current implementation status

The GitHub Pages frontend is static. A separate Cloudflare staging Control API provides read-only health, service, agent and provider registries. The OCode.js CLI Pages theme is merged to main. Agent/Provider Registry and expanded MCP discovery are staged behind open PRs; Production remains unchanged.

The OCodeJS CLI GitHub OAuth/PAT Worker is separate from Account Portal Auth.js. The Account Portal Preview build succeeded behind Cloudflare Access, but it has no dedicated PostgreSQL database or Preview OAuth secrets; sign-in is disabled. The staging MCP server exposes six read-only tools, including provider listing and lookup. The Provider Registry lists Workers AI as not configured; the runtime readiness endpoint confirms that inference, agent execution and run lifecycle remain disabled. Workers Logs/Traces are enabled, while centralized metrics and queryable audit storage remain pending.

## Development

This repository intentionally avoids storing credentials or operational data. Configure backend endpoints and secrets only in the appropriate server-side deployment environment. Use staging for integration work; follow the [deployment runbook](docs/deployment-runbook.md). Production changes require explicit approval.
