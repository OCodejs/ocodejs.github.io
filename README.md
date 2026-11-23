# OCodeJS Server

OCodeJS Server Control Center and public technical documentation.

- **Ecosystem Hub:** [project directory](ecosystem/) · [ecosystem overview](docs/ecosystem-overview.md)

- **Custom domain:** https://ocodejs.co (CNAME declared; verify DNS and HTTPS in GitHub Pages). Fallback: https://ocodejs.github.io/
- **Control Center source:** [index.html](index.html)
- **Project Registry:** [projects/](projects/index.html) · [registry JSON](projects.registry.json)
- **OCode.js Profile spec:** [multi-user architecture](docs/profile-system.md) · [API contract](docs/profile-api-contract.md) · [UI preview](profile/preview.html)
- **Ecosystem sync architecture:** [docs/ecosystem-registry.md](docs/ecosystem-registry.md)
- **Technical documentation:** [architecture and documentation overview](docs/architecture.md)
- **Architecture:** [docs/architecture.md](docs/architecture.md)
- **API contract:** [docs/api-contract.md](docs/api-contract.md)
- **Control API staging connection guide:** [docs/control-api-staging.md](docs/control-api-staging.md)
- **Authentication integration status:** [docs/auth-integration-status.md](docs/auth-integration-status.md)
- **Environment configuration:** [docs/environment-configuration.md](docs/environment-configuration.md)
- **Deployment runbook:** [docs/deployment-runbook.md](docs/deployment-runbook.md)
- **Security baseline:** [docs/security.md](docs/security.md)
- **Delivery roadmap:** [docs/roadmap.md](docs/roadmap.md)

## Current implementation status

The GitHub Pages frontend is static. A separate Cloudflare staging Control API provides read-only health, service, agent and provider registries. The OCode.js CLI Pages theme is merged to main. Agent/Provider Registry and expanded MCP discovery are staged behind open PRs; Production remains unchanged.

The OCodeJS CLI GitHub OAuth/PAT Worker is separate from Account Portal Auth.js. The Account Portal source is the separate `OCodejs/mcp.auth.ocodejs` application, deployed through the Vercel project `mcp-auth-ocodejs`; GitHub Pages is only the static Control Center and never handles login credentials or sessions. The latest observed Auth Preview is a READY build from an older feature branch, not a fresh build of current `main`. Current `main` has a package manifest / lockfile mismatch that must be reconciled before a reproducible Preview build. Database readiness, OAuth callbacks, session persistence and logout are not verified; sign-in remains disabled. The staging MCP server exposes six read-only tools, including provider listing and lookup. The Provider Registry lists Workers AI as not configured; the runtime readiness endpoint confirms that inference, agent execution and run lifecycle remain disabled. Workers Logs/Traces are enabled, while centralized metrics and queryable audit storage remain pending.

## Development

This repository intentionally avoids storing credentials or operational data. Configure backend endpoints and secrets only in the appropriate server-side deployment environment. Use staging for integration work; follow the [deployment runbook](docs/deployment-runbook.md). Production changes require explicit approval.
