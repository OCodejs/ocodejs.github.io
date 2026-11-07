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

The GitHub Pages frontend is static. A separate Cloudflare staging Control API provides read-only liveness, readiness and service-registry endpoints. Dashboard live-data integration is under review in PR #5; CLI OAuth health monitoring and Account Portal readiness are under review in PR #6.

The OCodeJS CLI GitHub OAuth/PAT Worker is a separate service from the Account Portal Auth.js application. The Account Portal is not ready for sign-in: its current Worker deployment is a 503 preparation stub and its Preview database/provider callbacks are not verified. AI Agent Runtime, MCP management and telemetry are not connected.

## Development

This repository intentionally avoids storing credentials or operational data. Configure backend endpoints and secrets only in the appropriate server-side deployment environment. Use staging for integration work; production changes require explicit approval.
