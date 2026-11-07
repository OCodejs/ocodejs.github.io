# OCodeJS Authentication Integration Status

## Verified services

### OCodeJS CLI GitHub Auth
- Cloudflare custom domain: `https://auth.ocodejs.dev`
- Worker: `ocodejs-auth`
- Cloudflare domain inventory maps the hostname to the `ocodejs-auth` Worker.
- The Worker source exposes a read-only `GET /health` response with service identity and boolean configuration indicators.
- The Worker has a D1 binding and GitHub OAuth/session/token-encryption bindings configured at the Cloudflare metadata level.
- The Control API probes only `GET /health`. It never requests a session, PAT, GitHub profile, token, or credential.
- A healthy probe means the health response is valid and the required configuration flags are present. It is not an end-to-end OAuth test.

### OCodeJS Account Portal Auth.js
- Canonical source repository: private `zskbot/mcp.server.auth`.
- Source supports Auth.js with Google OAuth, GitHub OAuth and email/password credentials, Prisma/PostgreSQL, bcrypt password hashing, and JWT sessions.
- Required runtime settings include `DATABASE_URL`, `AUTH_SECRET`, Google OAuth credentials and GitHub OAuth credentials.
- The current Cloudflare `mcp-server-auth` script is a placeholder returning HTTP 503 with a “Preview deployment is being prepared” response.
- Its current Worker bindings show only `AUTH_SECRET`; no verified account portal database/provider bindings are attached.
- No Vercel project linked to `zskbot/mcp.server.auth` was found in the AITools team project inventory.

## Integration boundary

The CLI GitHub Auth Worker and the Account Portal Auth.js application are different systems. Do not label the CLI OAuth health probe as the account sign-in backend.

The Account Portal remains `not_configured` until a dedicated Preview runtime is deployed with an isolated PostgreSQL database, Auth.js secrets, Google/GitHub callback URLs, and verified registration/login/session/logout flows.

## Safety
- Do not change the existing `auth.ocodejs.dev` Production Worker, its D1 database, secrets, OAuth app, or domain routing as part of this status integration.
- Do not connect the Control Center sign-in form to the CLI PAT/OAuth endpoint.
- Do not enable account sign-in controls until the account portal has passed Preview end-to-end tests.
