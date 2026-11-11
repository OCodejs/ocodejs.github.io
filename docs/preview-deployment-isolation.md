# Preview deployment isolation and build triage

## Current repository topology

- `OCodejs/ocodejs.github.io` is the static OCode.js Control Center / GitHub Pages source.
- It contains `profile/preview.html`, a static preview page. It is not the Next.js Profile application.
- Vercel project `ocodejs-profile` is currently connected to `OCodejs/ocodejs.github.io` and configured as Next.js.
- Its Preview build runs `npm install` at repository root and fails with `ENOENT: package.json` because this repository has no root `package.json`.

## Correct remediation

Do not add a fake root `package.json` to the GitHub Pages repository and do not point the Next.js project at `profile/`; that folder contains only a static preview HTML file, not the Profile app source.

The Vercel project must be connected to the actual Profile application repository, with the app's real package manifest and correct root directory. If that repository is private or inaccessible to the current GitHub connector, confirm its exact repository URL and access before changing the Vercel Git integration.

No Vercel project settings were changed and no Production deployment was triggered.

## Control API staging diagnostics

Cloudflare account inspection confirmed:
- Account workers.dev subdomain: `ocodejs-df1`.
- Worker: `ocodejs-server-api-staging`.
- Worker deployment: 100% on its current version.
- Worker-level workers.dev setting: enabled.
- No custom Worker Domain mapping for `api-staging.ocodejs.co` was found in the connected Cloudflare account.
- GitHub Actions could not resolve `ocodejs-server-api-staging.ocodejs-df1.workers.dev` and reported `ENOTFOUND`.

A successful Worker upload/deployment is not proof of public DNS or API health. Keep the dashboard in `UNVERIFIED` until the live health/readiness/services/CORS smoke test passes.

Do not attach a custom domain or change DNS as a workaround without confirming that the `ocodejs.co` zone is present in the correct Cloudflare account and receiving explicit approval for that domain operation.
