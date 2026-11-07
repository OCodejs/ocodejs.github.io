# OCodeJS Authentication Integration Status

## Separate services

### OCodeJS CLI GitHub Auth
- Health endpoint: `https://auth.ocodejs.dev/health`.
- Cloudflare Worker: `ocodejs-auth`.
- Control API performs a read-only GET health probe and reads only service identity plus boolean configuration flags.
- This probe is not an OAuth login, PAT issuance or user-session test.

### OCodeJS Account Portal Auth.js
- Canonical source: private repository `zskbot/mcp.server.auth`.
- Auth.js source includes GitHub OAuth, Google OAuth, email/password Credentials, Prisma/PostgreSQL and JWT sessions.
- The Account Portal runtime is not deployed as a verified Preview. The separate `mcp-server-auth` Worker remains a 503 preparation placeholder.
- The Account Portal requires a dedicated Preview runtime, isolated PostgreSQL database, Auth.js secret and provider callback configuration before sign-in can be enabled.

## CI / Preview status
- GitHub Actions in the private Auth repository repeatedly reports `startup_failure` with zero jobs on both feature and main refs. TypeScript checking and Next.js build have not executed.
- Vercel project discovery for the private repository previously returned `repo_not_found`; no Preview deployment is verified.
- No credentials or secrets are stored in this repository.

## Integration boundary
The CLI OAuth/PAT Worker is not the Account Portal. Do not connect the Control Center account form to CLI PAT endpoints. Keep sign-in controls disabled until Preview registration, login, OAuth callbacks, session persistence and logout are tested end-to-end.

## Safety
No production Worker, DNS route, OAuth app, database, secret or account data is changed by this integration.
