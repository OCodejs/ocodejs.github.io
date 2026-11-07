# OCodeJS Server

OCodeJS Server Control Center and public technical documentation.

- **Live frontend:** https://ocodejs.github.io/
- **Control Center source:** [index.html](index.html)
- **Technical documentation:** [docs/](docs/index.md)
- **Architecture:** [docs/architecture.md](docs/architecture.md)
- **API contract draft:** [docs/api-contract.md](docs/api-contract.md)
- **Security baseline:** [docs/security.md](docs/security.md)
- **Delivery roadmap:** [docs/roadmap.md](docs/roadmap.md)

## Current implementation status

This repository currently contains a static GitHub Pages frontend and documentation. Dashboard metrics, AI agent execution, API Gateway, Authentication, MCP connections and Developer Console telemetry require separately implemented backend services. The UI must not represent these as connected until live checks succeed.

## Development

This repository intentionally avoids storing credentials or operational data. Configure backend endpoints and secrets only in the appropriate server-side deployment environment. Use staging for integration work; production changes require explicit approval.
