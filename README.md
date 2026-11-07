# OCodeJS Server

OCodeJS Server Control Center and public technical documentation.

- **Live frontend:** https://ocodejs.github.io/
- **Control Center source:** [index.html](index.html)
- **Technical documentation:** [docs/](docs/index.md)
- **Architecture:** [docs/architecture.md](docs/architecture.md)
- **API contract:** [docs/api-contract.md](docs/api-contract.md)
- **Authentication integration status:** [docs/auth-integration-status.md](docs/auth-integration-status.md)
- **Security baseline:** [docs/security.md](docs/security.md)
- **Delivery roadmap:** [docs/roadmap.md](docs/roadmap.md)

## Current implementation status

The GitHub Pages frontend is static. A separate Cloudflare staging Control API provides read-only liveness, readiness and service-registry endpoints. The live Dashboard, OCode.js CLI theme, and MCP staging server are merged to main. The Control API is read-only and staging-backed; Account Portal Auth.js is still not deployed.

The OCodeJS CLI GitHub OAuth/PAT Worker is a separate service from the Account Portal Auth.js application. The Account Portal is not ready for sign-in: its current Worker deployment is a 503 preparation stub and its Preview database/provider callbacks are not verified. MCP initialize/tools/list is implemented on staging with two read-only tools. AI Agent Runtime and centralized telemetry are not connected.

## Development

This repository intentionally avoids storing credentials or operational data. Configure backend endpoints and secrets only in the appropriate server-side deployment environment. Use staging for integration work; production changes require explicit approval.
