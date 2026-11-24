# OCodeJS organization ecosystem audit

**Inventory date:** 2026-11-24  
**Organization:** [OCodejs](https://github.com/OCodejs)  
**Repositories discovered:** 76  
**Registry entries after this change:** 76  
**Existing registry entries:** 38  
**New catalog entries:** 38

## Executive findings

The organization contains a mixture of product applications, framework and SDK sources, documentation collections, authentication services, infrastructure projects, agent skills, examples, and upstream/reference repositories. These repositories should be discoverable through one central ecosystem UI, but they should not be flattened into one runtime or have their source copied indiscriminately.

The current central repository, `OCodejs/ocodejs.github.io`, already provides a static Control Center, project directory, shared design assets, a project registry, and a pull-request-based synchronization policy. The current registry contained 38 entries while the organization inventory returned 76 repositories. This change adds the missing 38 repositories as catalog entries.

## Architecture decision

- **Central directory:** `OCodejs/ocodejs.github.io` is the catalog/control-center source.
- **Source of truth:** each existing repository remains authoritative for its own application, package, docs, or service.
- **Shared UX:** one canonical OCodeJS design system and navigation contract; app-specific flows remain in their owning repositories.
- **Integration:** use versioned packages or explicit managed-file sync through Pull Requests, not blind bulk copies.
- **Security:** never copy secrets, environment files, private keys, user data, or deployment credentials into the central repository.
- **Deployment:** Preview/staging first. No Production deployment, DNS change, merge, repository deletion, or paid resource creation is authorized by this audit.
- **Sync opt-in:** all newly catalogued repositories have synchronization disabled until their source, build, license, ownership, and integration boundaries are reviewed.

## Proposed product navigation

1. **Discover** — ecosystem home, repository directory, categories, search, status, featured projects.
2. **Build** — OCode.js core, SDKs, CLI Hub, templates, Codespaces, starter projects.
3. **AI Studio** — Ask Chatbot, Ask OCodeJS, agents, model/provider integrations.
4. **Identity** — Auth, OAuth, account/profile, gateway, session and provider integrations.
5. **Platform** — API, hosting, runtime, automation, deployment and observability.
6. **Docs** — documentation hubs, API references, guides, policies and examples.
7. **Community** — skills, workflows, reusable templates, contribution guides and legal/licensing information.

## Design-system contract

- Dark/black minimal visual language, high-contrast typography, restrained blue/violet accents.
- JetBrains Mono or a compatible monospace stack for technical surfaces.
- Square-corner buttons and controls; no rounded-pill controls.
- Responsive desktop/mobile navigation, accessible focus states, keyboard operation, reduced-motion support.
- Shared tokens and primitives should be consumed from one canonical source; product-specific visual variations must be explicit and isolated.
- Do not overwrite the canonical homepage/control-center layout as part of unrelated integrations.

## Repository inventory

| Repository | Visibility | Default branch | Catalog status |
|---|---|---|---|
| [ask-chatbot](https://github.com/OCodejs/ask-chatbot) | public | `main` | Already catalogued |
| [mcp.auth.ocodejs](https://github.com/OCodejs/mcp.auth.ocodejs) | public | `main` | Added, sync disabled |
| [ask-ocodejs](https://github.com/OCodejs/ask-ocodejs) | public | `main` | Added, sync disabled |
| [oauth](https://github.com/OCodejs/oauth) | public | `main` | Added, sync disabled |
| [0codejs](https://github.com/OCodejs/0codejs) | private | `main` | Already catalogued |
| [THU365](https://github.com/OCodejs/THU365) | public | `main` | Already catalogued |
| [docss](https://github.com/OCodejs/docss) | public | `main` | Added, sync disabled |
| [ocodejs.github.io](https://github.com/OCodejs/ocodejs.github.io) | public | `main` | Already catalogued |
| [OCODEJS](https://github.com/OCodejs/OCODEJS) | public | `main` | Already catalogued |
| [Autorun](https://github.com/OCodejs/Autorun) | public | `main` | Added, sync disabled |
| [docs.md](https://github.com/OCodejs/docs.md) | public | `main` | Added, sync disabled |
| [docs.mdx](https://github.com/OCodejs/docs.mdx) | public | `main` | Added, sync disabled |
| [docs](https://github.com/OCodejs/docs) | public | `main` | Already catalogued |
| [PostgreSQL](https://github.com/OCodejs/PostgreSQL) | public | `main` | Added, sync disabled |
| [Codespaces-OCodeJS](https://github.com/OCodejs/Codespaces-OCodeJS) | public | `main` | Added, sync disabled |
| [ocodejs-monorepo](https://github.com/OCodejs/ocodejs-monorepo) | public | `main` | Added, sync disabled |
| [mcp.server.auth](https://github.com/OCodejs/mcp.server.auth) | public | `main` | Added, sync disabled |
| [skills-agentc](https://github.com/OCodejs/skills-agentc) | public | `main` | Already catalogued |
| [docs.rtf](https://github.com/OCodejs/docs.rtf) | public | `main` | Added, sync disabled |
| [Ocodejs-codespaces](https://github.com/OCodejs/Ocodejs-codespaces) | public | `main` | Added, sync disabled |
| [workflow](https://github.com/OCodejs/workflow) | public | `main` | Added, sync disabled |
| [proof-html](https://github.com/OCodejs/proof-html) | public | `master` | Already catalogued |
| [octocat.github.io](https://github.com/OCodejs/octocat.github.io) | public | `master` | Added, sync disabled |
| [docs-ocodejs](https://github.com/OCodejs/docs-ocodejs) | public | `main` | Already catalogued |
| [ai](https://github.com/OCodejs/ai) | public | `main` | Added, sync disabled |
| [annotated_implementation_skill](https://github.com/OCodejs/annotated_implementation_skill) | public | `main` | Already catalogued |
| [opencode](https://github.com/OCodejs/opencode) | public | `dev` | Already catalogued |
| [nextjs-auth0](https://github.com/OCodejs/nextjs-auth0) | public | `main` | Added, sync disabled |
| [demo-repository](https://github.com/OCodejs/demo-repository) | public | `main` | Already catalogued |
| [eve-chat-template](https://github.com/OCodejs/eve-chat-template) | private | `main` | Added, sync disabled |
| [Authentication](https://github.com/OCodejs/Authentication) | public | `main` | Added, sync disabled |
| [dotfiles.github.com](https://github.com/OCodejs/dotfiles.github.com) | public | `master` | Already catalogued |
| [github-pages](https://github.com/OCodejs/github-pages) | public | `main` | Already catalogued |
| [feat-ocodejs-chatbot-integration](https://github.com/OCodejs/feat-ocodejs-chatbot-integration) | public | `main` | Added, sync disabled |
| [website](https://github.com/OCodejs/website) | public | `main` | Added, sync disabled |
| [ocode.js](https://github.com/OCodejs/ocode.js) | public | `canary` | Already catalogued |
| [checkout](https://github.com/OCodejs/checkout) | public | `main` | Added, sync disabled |
| [api](https://github.com/OCodejs/api) | public | `main` | Added, sync disabled |
| [SKILLS.SH](https://github.com/OCodejs/SKILLS.SH) | public | `main` | Added, sync disabled |
| [v0-chat](https://github.com/OCodejs/v0-chat) | private | `main` | Already catalogued |
| [spec](https://github.com/OCodejs/spec) | public | `main` | Already catalogued |
| [.agents-skills-prisma-cli-SKILL.md](https://github.com/OCodejs/.agents-skills-prisma-cli-SKILL.md) | public | `main` | Already catalogued |
| [hello-working](https://github.com/OCodejs/hello-working) | public | `main` | Already catalogued |
| [next-platform-starter](https://github.com/OCodejs/next-platform-starter) | public | `main` | Added, sync disabled |
| [Cloudxx](https://github.com/OCodejs/Cloudxx) | public | `main` | Already catalogued |
| [probot](https://github.com/OCodejs/probot) | public | `master` | Already catalogued |
| [surge](https://github.com/OCodejs/surge) | public | `master` | Already catalogued |
| [repository](https://github.com/OCodejs/repository) | public | `main` | Added, sync disabled |
| [OCode-js-pages](https://github.com/OCodejs/OCode-js-pages) | public | `main` | Already catalogued |
| [studio](https://github.com/OCodejs/studio) | public | `main` | Added, sync disabled |
| [v0-sdk](https://github.com/OCodejs/v0-sdk) | public | `main` | Added, sync disabled |
| [nextjs-boilerplate](https://github.com/OCodejs/nextjs-boilerplate) | public | `main` | Already catalogued |
| [chatbot](https://github.com/OCodejs/chatbot) | public | `main` | Already catalogued |
| [gh-aw](https://github.com/OCodejs/gh-aw) | public | `main` | Already catalogued |
| [next-platform-starter-3d98a](https://github.com/OCodejs/next-platform-starter-3d98a) | public | `main` | Added, sync disabled |
| [skills](https://github.com/OCodejs/skills) | public | `main` | Already catalogued |
| [ocodejs-legal](https://github.com/OCodejs/ocodejs-legal) | public | `main` | Already catalogued |
| [cli-hub](https://github.com/OCodejs/cli-hub) | public | `main` | Already catalogued |
| [ocodejs-api](https://github.com/OCodejs/ocodejs-api) | public | `main` | Added, sync disabled |
| [vscode-codeql-starter](https://github.com/OCodejs/vscode-codeql-starter) | public | `main` | Added, sync disabled |
| [Signs](https://github.com/OCodejs/Signs) | public | `main` | Already catalogued |
| [codespaces](https://github.com/OCodejs/codespaces) | public | `main` | Added, sync disabled |
| [aitools-agent](https://github.com/OCodejs/aitools-agent) | public | `main` | Already catalogued |
| [.github](https://github.com/OCodejs/.github) | public | `main` | Already catalogued |
| [sdk](https://github.com/OCodejs/sdk) | public | `main` | Added, sync disabled |
| [workflow-examples](https://github.com/OCodejs/workflow-examples) | public | `main` | Added, sync disabled |
| [satori](https://github.com/OCodejs/satori) | public | `main` | Added, sync disabled |
| [vercel](https://github.com/OCodejs/vercel) | public | `main` | Added, sync disabled |
| [qstash-js](https://github.com/OCodejs/qstash-js) | public | `main` | Added, sync disabled |
| [Spoon-Knife](https://github.com/OCodejs/Spoon-Knife) | public | `main` | Already catalogued |
| [pnpm](https://github.com/OCodejs/pnpm) | public | `main` | Already catalogued |
| [documentation](https://github.com/OCodejs/documentation) | public | `main` | Already catalogued |
| [auth-gateway-phase-1-2](https://github.com/OCodejs/auth-gateway-phase-1-2) | public | `main` | Added, sync disabled |
| [host](https://github.com/OCodejs/host) | public | `main` | Already catalogued |
| [github-mcp-server](https://github.com/OCodejs/github-mcp-server) | public | `main` | Already catalogued |
| [platform-ocodejs-dev](https://github.com/OCodejs/platform-ocodejs-dev) | public | `main` | Already catalogued |


## Validation gaps

This is an organization-level inventory and architecture audit, not a claim that every source file, workflow, secret, runtime, database, or deployment has been fully audited. The next per-repository pass must inspect README, manifests/lockfiles, source entrypoints, CI workflows, tests, license, deployment configuration, open PRs, and active domains. Very large upstream mirrors and private repositories require separate review before any source-level integration.

## Rollout gates

1. Validate this catalog and registry schema.
2. Inspect each repository's source and classify it as product, shared package, service, documentation, skill, example, or upstream mirror.
3. Select the smallest reusable shared UI package and add adapters only where compatible.
4. Build a central Preview and run mobile/desktop accessibility and navigation tests.
5. Open separate repository PRs for opt-in integrations; never batch-merge them.
6. Verify each Preview independently before any explicit Production release approval.
