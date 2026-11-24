# OCodeJS repository audit — 2026-11-24

## Scope and confidence

The organization search returned **76 repositories**. Root directory listings were successfully inspected for **74/76**; two lookups were inconclusive because the remote API disconnected or returned content that did not match the requested repository:
- `OCodejs/docs.mdx` — remote protocol disconnect.
- `OCodejs/.agents-skills-prisma-cli-SKILL.md` — returned content could not be trusted as a repository-specific listing.

All 76 repositories are represented in the central registry. Classification is a working product taxonomy, not a legal or operational attestation. **22 upstream forks were explicitly verified** using GitHub repository metadata. The remaining repositories are marked lineage-unverified, not assumed to be original.

Root scans recorded README, manifest/lockfile presence, source directory structure, `.github` presence, and deployment-config filename presence. A root `.github` directory is not proof that workflows pass. A Vercel/Wrangler/Pages config is not proof of a healthy deployment.

## Taxonomy

| Repository | Type | Source lineage | Audit depth |
|---|---|---|---|
| [.agents-skills-prisma-cli-SKILL.md](https://github.com/OCodejs/.agents-skills-prisma-cli-SKILL.md) | documentation | Lineage not yet checked | manifest-presence-reviewed |
| [.github](https://github.com/OCodejs/.github) | application | Lineage not yet checked | manifest-presence-reviewed |
| [0codejs](https://github.com/OCodejs/0codejs) | application | Lineage not yet checked | manifest-presence-reviewed |
| [ai](https://github.com/OCodejs/ai) | application | Lineage not yet checked | manifest-presence-reviewed |
| [aitools-agent](https://github.com/OCodejs/aitools-agent) | skills | Lineage not yet checked | manifest-presence-reviewed |
| [annotated_implementation_skill](https://github.com/OCodejs/annotated_implementation_skill) | skills | Lineage not yet checked | manifest-presence-reviewed |
| [api](https://github.com/OCodejs/api) | service | Lineage not yet checked | manifest-presence-reviewed |
| [ask-chatbot](https://github.com/OCodejs/ask-chatbot) | application | Lineage not yet checked | manifest-reviewed |
| [ask-ocodejs](https://github.com/OCodejs/ask-ocodejs) | application | Lineage not yet checked | manifest-presence-reviewed |
| [auth-gateway-phase-1-2](https://github.com/OCodejs/auth-gateway-phase-1-2) | service | Lineage not yet checked | manifest-presence-reviewed |
| [Authentication](https://github.com/OCodejs/Authentication) | service | Lineage not yet checked | manifest-presence-reviewed |
| [Autorun](https://github.com/OCodejs/Autorun) | application | Lineage not yet checked | manifest-presence-reviewed |
| [chatbot](https://github.com/OCodejs/chatbot) | application | Lineage not yet checked | manifest-presence-reviewed |
| [checkout](https://github.com/OCodejs/checkout) | application | Lineage not yet checked | manifest-presence-reviewed |
| [cli-hub](https://github.com/OCodejs/cli-hub) | shared-library | Lineage not yet checked | manifest-reviewed |
| [Cloudxx](https://github.com/OCodejs/Cloudxx) | service | Lineage not yet checked | manifest-presence-reviewed |
| [codespaces](https://github.com/OCodejs/codespaces) | application | Lineage not yet checked | manifest-presence-reviewed |
| [Codespaces-OCodeJS](https://github.com/OCodejs/Codespaces-OCodeJS) | application | Lineage not yet checked | manifest-presence-reviewed |
| [demo-repository](https://github.com/OCodejs/demo-repository) | example-reference | Lineage not yet checked | manifest-presence-reviewed |
| [docs](https://github.com/OCodejs/docs) | documentation | Lineage not yet checked | manifest-presence-reviewed |
| [docs-ocodejs](https://github.com/OCodejs/docs-ocodejs) | documentation | Lineage not yet checked | manifest-reviewed |
| [docs.md](https://github.com/OCodejs/docs.md) | documentation | Lineage not yet checked | manifest-presence-reviewed |
| [docs.mdx](https://github.com/OCodejs/docs.mdx) | documentation | Lineage not yet checked | manifest-presence-reviewed |
| [docs.rtf](https://github.com/OCodejs/docs.rtf) | documentation | Lineage not yet checked | manifest-presence-reviewed |
| [docss](https://github.com/OCodejs/docss) | documentation | Lineage not yet checked | manifest-presence-reviewed |
| [documentation](https://github.com/OCodejs/documentation) | documentation | Lineage not yet checked | manifest-presence-reviewed |
| [dotfiles.github.com](https://github.com/OCodejs/dotfiles.github.com) | example-reference | Confirmed upstream fork | manifest-presence-reviewed |
| [eve-chat-template](https://github.com/OCodejs/eve-chat-template) | application | Lineage not yet checked | manifest-presence-reviewed |
| [feat-ocodejs-chatbot-integration](https://github.com/OCodejs/feat-ocodejs-chatbot-integration) | application | Lineage not yet checked | manifest-presence-reviewed |
| [gh-aw](https://github.com/OCodejs/gh-aw) | shared-library | Confirmed upstream fork | manifest-presence-reviewed |
| [github-mcp-server](https://github.com/OCodejs/github-mcp-server) | service | Confirmed upstream fork | manifest-presence-reviewed |
| [github-pages](https://github.com/OCodejs/github-pages) | application | Confirmed upstream fork | manifest-presence-reviewed |
| [hello-working](https://github.com/OCodejs/hello-working) | example-reference | Lineage not yet checked | manifest-presence-reviewed |
| [host](https://github.com/OCodejs/host) | service | Lineage not yet checked | manifest-presence-reviewed |
| [mcp.auth.ocodejs](https://github.com/OCodejs/mcp.auth.ocodejs) | service | Lineage not yet checked | manifest-reviewed |
| [mcp.server.auth](https://github.com/OCodejs/mcp.server.auth) | service | Lineage not yet checked | manifest-reviewed |
| [next-platform-starter](https://github.com/OCodejs/next-platform-starter) | service | Lineage not yet checked | manifest-presence-reviewed |
| [next-platform-starter-3d98a](https://github.com/OCodejs/next-platform-starter-3d98a) | service | Lineage not yet checked | manifest-presence-reviewed |
| [nextjs-auth0](https://github.com/OCodejs/nextjs-auth0) | service | Confirmed upstream fork | manifest-presence-reviewed |
| [nextjs-boilerplate](https://github.com/OCodejs/nextjs-boilerplate) | shared-library | Lineage not yet checked | manifest-presence-reviewed |
| [oauth](https://github.com/OCodejs/oauth) | service | Lineage not yet checked | manifest-presence-reviewed |
| [OCode-js-pages](https://github.com/OCodejs/OCode-js-pages) | application | Lineage not yet checked | manifest-presence-reviewed |
| [ocode.js](https://github.com/OCodejs/ocode.js) | application | Lineage not yet checked | manifest-presence-reviewed |
| [OCODEJS](https://github.com/OCodejs/OCODEJS) | application | Lineage not yet checked | manifest-reviewed |
| [ocodejs-api](https://github.com/OCodejs/ocodejs-api) | service | Lineage not yet checked | manifest-presence-reviewed |
| [Ocodejs-codespaces](https://github.com/OCodejs/Ocodejs-codespaces) | application | Lineage not yet checked | manifest-presence-reviewed |
| [ocodejs-legal](https://github.com/OCodejs/ocodejs-legal) | documentation | Lineage not yet checked | manifest-presence-reviewed |
| [ocodejs-monorepo](https://github.com/OCodejs/ocodejs-monorepo) | application | Lineage not yet checked | manifest-reviewed |
| [ocodejs.github.io](https://github.com/OCodejs/ocodejs.github.io) | application | Lineage not yet checked | manifest-presence-reviewed |
| [octocat.github.io](https://github.com/OCodejs/octocat.github.io) | application | Confirmed upstream fork | manifest-presence-reviewed |
| [opencode](https://github.com/OCodejs/opencode) | shared-library | Confirmed upstream fork | manifest-presence-reviewed |
| [platform-ocodejs-dev](https://github.com/OCodejs/platform-ocodejs-dev) | service | Lineage not yet checked | manifest-presence-reviewed |
| [pnpm](https://github.com/OCodejs/pnpm) | shared-library | Confirmed upstream fork | manifest-presence-reviewed |
| [PostgreSQL](https://github.com/OCodejs/PostgreSQL) | service | Lineage not yet checked | manifest-presence-reviewed |
| [probot](https://github.com/OCodejs/probot) | service | Confirmed upstream fork | manifest-presence-reviewed |
| [proof-html](https://github.com/OCodejs/proof-html) | shared-library | Confirmed upstream fork | manifest-presence-reviewed |
| [qstash-js](https://github.com/OCodejs/qstash-js) | shared-library | Confirmed upstream fork | manifest-presence-reviewed |
| [repository](https://github.com/OCodejs/repository) | application | Lineage not yet checked | manifest-presence-reviewed |
| [satori](https://github.com/OCodejs/satori) | shared-library | Confirmed upstream fork | manifest-presence-reviewed |
| [sdk](https://github.com/OCodejs/sdk) | shared-library | Confirmed upstream fork | manifest-reviewed |
| [Signs](https://github.com/OCodejs/Signs) | application | Lineage not yet checked | manifest-presence-reviewed |
| [skills](https://github.com/OCodejs/skills) | skills | Lineage not yet checked | manifest-presence-reviewed |
| [skills-agentc](https://github.com/OCodejs/skills-agentc) | skills | Lineage not yet checked | manifest-presence-reviewed |
| [SKILLS.SH](https://github.com/OCodejs/SKILLS.SH) | skills | Lineage not yet checked | manifest-presence-reviewed |
| [spec](https://github.com/OCodejs/spec) | documentation | Lineage not yet checked | manifest-presence-reviewed |
| [Spoon-Knife](https://github.com/OCodejs/Spoon-Knife) | example-reference | Confirmed upstream fork | manifest-presence-reviewed |
| [studio](https://github.com/OCodejs/studio) | application | Lineage not yet checked | manifest-presence-reviewed |
| [surge](https://github.com/OCodejs/surge) | service | Confirmed upstream fork | manifest-presence-reviewed |
| [THU365](https://github.com/OCodejs/THU365) | application | Lineage not yet checked | manifest-reviewed |
| [v0-chat](https://github.com/OCodejs/v0-chat) | application | Lineage not yet checked | manifest-presence-reviewed |
| [v0-sdk](https://github.com/OCodejs/v0-sdk) | shared-library | Confirmed upstream fork | manifest-presence-reviewed |
| [vercel](https://github.com/OCodejs/vercel) | shared-library | Confirmed upstream fork | manifest-presence-reviewed |
| [vscode-codeql-starter](https://github.com/OCodejs/vscode-codeql-starter) | example-reference | Confirmed upstream fork | manifest-presence-reviewed |
| [website](https://github.com/OCodejs/website) | application | Lineage not yet checked | manifest-presence-reviewed |
| [workflow](https://github.com/OCodejs/workflow) | application | Lineage not yet checked | manifest-presence-reviewed |
| [workflow-examples](https://github.com/OCodejs/workflow-examples) | example-reference | Lineage not yet checked | manifest-presence-reviewed |

## Classification totals

| Type | Repositories |
|---|---:|
| Applications | 27 |
| Services / infrastructure | 17 |
| Documentation | 10 |
| Shared libraries / SDKs | 11 |
| Skills | 5 |
| Examples / references | 6 |
| **Total** | **76** |

Source lineage: 22 confirmed upstream forks; 58 repositories remain lineage-unverified. A repository's product type and source lineage are separate attributes.

## Confirmed upstream forks

| Repository | Upstream |
|---|---|
| `OCodejs/opencode` | `anomalyco/opencode` |
| `OCodejs/probot` | `probot/probot` |
| `OCodejs/surge` | `sintaxi/surge` |
| `OCodejs/sdk` | `vercel/sdk` |
| `OCodejs/vercel` | `vercel/vercel` |
| `OCodejs/pnpm` | `pnpm/pnpm` |
| `OCodejs/satori` | `vercel/satori` |
| `OCodejs/qstash-js` | `upstash/qstash-js` |
| `OCodejs/nextjs-auth0` | `auth0/nextjs-auth0` |
| `OCodejs/github-mcp-server` | `github/github-mcp-server` |
| `OCodejs/octocat.github.io` | `octocat/octocat.github.io` |
| `OCodejs/Spoon-Knife` | `octocat/Spoon-Knife` |
| `OCodejs/v0-sdk` | `vercel/v0-sdk` |
| `OCodejs/github-pages` | `skills/github-pages` |
| `OCodejs/dotfiles.github.com` | `dotfiles/dotfiles.github.com` |
| `OCodejs/vscode-codeql-starter` | `github/vscode-codeql-starter` |
| `OCodejs/gh-aw` | `github/gh-aw` |
| `OCodejs/proof-html` | `anishathalye/proof-html` |
| `OCodejs/Cloudxx` | `Velclaw/Cloudxx` |
| `OCodejs/documentation` | `npm/documentation` |
| `OCodejs/ocode.js` | `vercel/next.js` |
| `OCodejs/v0-chat` | `zskbot/v0-chat` |

Forks are upstream-owned codebases. OCodeJS-specific changes must remain in isolated branches and be rebased/compared against upstream; no bulk UI injection or ownership claims.

## Deeper source and dependency review

The following manifests/configurations were read directly:

| Repository | Observed stack and checks |
|---|---|
| `ask-chatbot` | Vite/React + Node/Express API, Vitest/ESLint scripts, package-lock, Vercel static build plus Node API routes. Dependency set is broad; isolate backend/API and browser bundle. |
| `THU365` | pnpm workspace, TypeScript project references, recursive package builds, Cloudflare Wrangler assets. `preinstall` explicitly rejects non-pnpm package managers. |
| `OCODEJS` | `ocode-js@0.1.0`, TypeScript build and Node tests, Vite multi-service Vercel config, npm lockfile. Treat this as core package/application source, not a generic UI target. |
| `ocodejs-monorepo` | Architecture document explicitly describes a proposed target map; not evidence that a monorepo migration is complete. Preserve independent app runtimes. |
| `mcp.auth.ocodejs` | Next.js 15, Auth.js beta, Prisma 6.19.3, PostgreSQL adapter, OpenNext/Cloudflare and Vercel config. Build includes a database push helper; require staging DB guard and end-to-end auth checks. |
| `mcp.server.auth` | Next.js 15, Auth.js beta, Prisma 6.19.3, Neon adapter, OpenNext/Cloudflare. Keep separate from Account Portal until ownership and provider boundaries are reconciled. |
| `docs-ocodejs` | Jekyll 4.3 with Gemfile.lock and Vercel config; integrate through documentation theme/tokens, not React components. |
| `cli-hub` | Node >=20, static Pages plus auth-server/auth-worker subprojects; root package exposes validate/test and nested auth tests. |
| `sdk` | `@vercel/sdk` 1.28.67, fork of `vercel/sdk`, TypeScript source, npm and pnpm lockfiles present. Do not overwrite upstream-generated SDK source. |
| `mcp.auth.ocodejs` deployment | Vercel config exists; current README states Account Portal readiness and callback/session persistence are not verified. |
| `ocodejs.github.io` | Static control center and Pages/registry; root build script is a placeholder echo, not a production compiler. Existing Vercel checks report blocked deployments/account status. |

## CI and deployment findings

- Root structure scan identifies `.github` workflow directories on most repositories; actual workflow contents, required checks, and latest run conclusions have not yet been exhaustively read for all 76.
- Manifest/lockfile presence is recorded in the inventory pass; only the nine repositories above received deeper manifest/config review in this pass.
- Deployment configuration presence is not runtime health. Vercel blocked checks observed on the central repository: `pages.ocodejs.theme`, `ocodejs-profile` and `ocodejs.github.io`.
- GitHub Actions checks for the earlier catalog PR were queued while Vercel deployment checks were blocked. No successful Preview URL was confirmed.
- No iPhone Safari or desktop browser session could be run against the new Preview because there is no verified deployment URL.

## Shared UI integration decision

The shared payload is framework-agnostic and split into the exact directory names consumed by `.github/workflows/ecosystem-sync.yml`:
- `design-system/tokens.css`
- `shared-ui/ui.css`
- `navigation/navigation.js`

The existing sync workflow copies each opted-in module to `.ocodejs/shared/{module}/` and opens PRs. The payload layout must match those module names; flat CSS files at the module root are not syncable and have been removed.

The central Control Center and Ecosystem Hub now load the shared CSS. The Account navigation entry links to the auth source repository with an explicit unverified status; it is not a login action. No session, credentials, or auth API is proxied through static Pages.

## Remaining gates

1. Resolve the two inconclusive repository root scans.
2. Read workflow files and inspect latest CI runs for all 76 repositories.
3. Read all dependency manifests/lockfiles and detect drift, vulnerable packages, and incompatible runtime versions.
4. Inspect deployment configuration and actual health independently per app/service.
5. Open dedicated PRs only for repositories whose explicit module opt-in, license, framework, and managed directory are compatible.
6. Obtain a working Preview deployment; run viewport, keyboard, accessibility, navigation, and account-boundary tests on iPhone Safari and desktop.
7. Keep all PRs unmerged and Production untouched until review and explicit release approval.
