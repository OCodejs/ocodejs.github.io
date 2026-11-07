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
- A Cloudflare Workers Preview build for branch `feat/auth-account-preview` completed successfully on commit `b25cef3198c3110dd6b3ccc098904c9b2a61c36e` (build `03a68bdf-1e01-4daf-8df5-31891c270a59`). The Preview URL is protected by the existing `Cloudflare Workers Preview URLs` Access policy. The build compiled and deployed, but the runtime health endpoint has not been independently verified.
- The Preview intentionally has no database or production secrets: Workers Previews do not inherit production settings. A dedicated Preview PostgreSQL database, `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, GitHub OAuth credentials and Google OAuth credentials are still required before the health endpoint can report ready or sign-in can be enabled.

## CI / Preview status
- GitHub Actions in the private Auth repository repeatedly reports `startup_failure` with zero jobs on both feature and main refs. TypeScript checking and Next.js build have not executed.
- Vercel project discovery for the private repository previously returned `repo_not_found`; the isolated Cloudflare Workers Preview is the current staging target. The build completed successfully, but HTTP route verification is blocked by the connected runner's outbound-host restriction.
- No credentials or secrets are stored in this repository.

## Integration boundary
The CLI OAuth/PAT Worker is not the Account Portal. Do not connect the Control Center account form to CLI PAT endpoints. Keep sign-in controls disabled until Preview registration, login, OAuth callbacks, session persistence and logout are tested end-to-end.

## Safety
No production Worker, DNS route, OAuth app, database, secret or account data is changed by this integration.
