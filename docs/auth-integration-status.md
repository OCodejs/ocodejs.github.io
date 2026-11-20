---
---

# OCodeJS Authentication Integration Status

## Separate services

### OCodeJS CLI GitHub Auth
- Health endpoint: `https://auth.ocodejs.dev/health`.
- Cloudflare Worker: `ocodejs-auth`.
- Control API performs a read-only GET health probe and reads only service identity plus boolean configuration flags.
- This probe is not an OAuth login, PAT issuance or user-session test.

### OCodeJS Account Portal Auth.js
- Canonical source: public repository [`OCodejs/mcp.auth.ocodejs`](https://github.com/OCodejs/mcp.auth.ocodejs).
- Runtime: Next.js 15, Auth.js v5, Prisma/PostgreSQL, Google OAuth, GitHub OAuth and email/password Credentials.
- Vercel project: `mcp-auth-ocodejs` in the connected `ocode-jss` team. The deployment metadata identifies `OCodejs/mcp.auth.ocodejs` as its Git source.
- Latest observed Preview: [`mcp-auth-ocodejs-fha05e4qc-ocode-jss.vercel.app`](https://mcp-auth-ocodejs-fha05e4qc-ocode-jss.vercel.app), state `READY`, branch `feat/auth-platform-phase1-security-audit`, commit `bd52ef0b70871794af9de9bc909eb758a90e5194`. Vercel SSO protection is enabled for all deployment targets.
- This is an older branch Preview, not a fresh Preview of current `main`. A READY build proves compilation/deployment only; it does not prove database readiness or authentication flows.
- Current `main` has a dependency lock mismatch: `package.json` declares `@prisma/adapter-pg@6.19.3` and `pg`, while the `package-lock.json` root still declares `@prisma/adapter-neon@6.19.3` and omits `pg`. Reconcile the lockfile before relying on `npm ci` or creating a fresh Preview.
- Vercel environment inventory was checked by variable name and target only; no secret values were read. `DATABASE_URL` and `DATABASE_URL_POOLED` are configured for development, Preview and Production targets. Branch-specific `AUTH_SECRET`, `AUTH_URL`, `AUTH_PREVIEW_DB_PUSH`, `AUTH_TRUST_HOST` and provider-disable flags were found on older Preview branches, but no branch-specific variables were returned for the latest observed Preview branch `feat/auth-platform-phase1-security-audit`. Its READY build therefore does not establish runtime Auth.js readiness.
- The Auth repository describes Preview isolation through the `auth_preview` PostgreSQL schema on the Auth-only database instance. This is schema-level isolation, not a separate physical database. Verify the actual Preview database target before any schema initialization; never point Preview at Production or another application's database.
- `GET /api/health` checks required configuration and a read-only PostgreSQL `SELECT 1`. It is a readiness signal, not proof of registration, OAuth callbacks, sessions or logout.
- Required environment variable names and Preview-only settings are documented in [Environment Configuration](environment-configuration.md) and the Auth repository's [`.env.example`](https://github.com/OCodejs/mcp.auth.ocodejs/blob/main/.env.example). No secret values belong in this repository.

## GitHub Pages and Vercel project boundary
- `OCodejs/ocodejs.github.io` remains the static GitHub Pages frontend. It must not host Auth.js handlers, receive passwords, store OAuth tokens or own user sessions.
- The Vercel project `ocodejs-profile` is currently linked to this Pages repository but is configured as Next.js. Its latest observed Production build fails because the repository root has no `package.json` (`ENOENT /vercel/path0/package.json`). Do not treat that project as the Account Portal or as proof that GitHub Pages is deployed.
- The Account Portal has its own Vercel project, `mcp-auth-ocodejs`. Do not connect the Control Center account UI to the CLI PAT endpoints or infer Auth.js health from the Control API identity registry.
- GitHub status links for some Vercel checks point to team slugs not present in the connected Vercel team list. Their build-rate-limit status cannot be reconciled from the current `ocode-jss` team connection alone.

## Preview release gate
1. Reconcile `package.json` and `package-lock.json`; do not hand-edit the lockfile or dispatch repeated builds.
2. Confirm the exact Vercel Preview project, branch and hostname. Keep Vercel SSO protection enabled.
3. Configure only Preview-scoped database and Auth.js variables. The Preview schema initialization flag `AUTH_PREVIEW_DB_PUSH` must never be enabled in Production.
4. Confirm `GET /api/health` returns `200 ready` against the intended isolated Preview database.
5. Verify registration, duplicate-email handling, invalid credentials, GitHub and Google callbacks, session persistence, profile creation, logout and negative authorization cases.
6. Keep sign-in controls disabled until all checks pass on the current mainline Preview.

## Integration boundary
- GitHub Pages is a static frontend. It may link to the separate Account Portal after a current Preview hostname is verified, but it must not proxy credentials or session cookies.
- CLI OAuth/PAT and Account Portal Auth.js are different identity services with separate sessions and authorization boundaries.
- Account linking must require proof of control of both identities; never merge accounts solely because email strings match.

## Safety
No Production Worker, DNS route, OAuth app, database, secret or account data is changed by this integration.

## Central dashboard integration (2026-11-21)

- The Authentication view in `index.html` now exposes the separate Account Portal source and a direct link to the last known Vercel Preview deployment.
- The linked deployment is explicitly labeled **STALE** and SSO-protected. It is a navigation handoff only; it is not a verified current-main Preview and must not be presented as a working sign-in endpoint.
- GitHub Pages does not embed Auth.js, proxy `/api/auth/*`, collect credentials, or share cookies. The Account Portal remains the only owner of Auth.js sessions and account data.
- Keep account sign-in disabled in the central dashboard until a fresh Preview built from the current Auth repository `main` passes the documented health, OAuth, session, registration, authorization and logout checks.
- No Auth repository files, Vercel environment variables, OAuth applications, database schemas, secrets, DNS records or Production deployments are changed by this dashboard-only integration.
