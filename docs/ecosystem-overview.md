---
---

# OCodeJS Ecosystem Overview

The Ecosystem Hub at [/ecosystem/](../ecosystem/) is the public directory for OCodeJS-owned repositories and connected development projects.

## Repository boundaries

- OCodejs/ocodejs.github.io is the public control center, documentation entry point and project directory.
- Product repositories remain the source of truth for application code, release history, issues and deployment configuration.
- The organization registry in projects.registry.json tracks 38 OCodejs repositories and their explicit shared-module opt-ins.
- The curated ecosystem/catalog.json adds selected cross-organization projects maintained under zskbot and Velclaw.
- The directory links to source repositories; it does not mirror application source or assert runtime health.

## Main project groups

| Group | Scope |
|---|---|
| Core | OCode.js core package, framework and shared platform |
| AI applications | Ask OCodeJS, Ask Chatbot, THU365 and agent projects |
| Developer tools | CLI Hub, v0 SDK, Codespaces and GitHub automation |
| Infrastructure | Control API, MCP, Autorun and authentication integration |
| Documentation | Technical documentation, guides and Legal Center |
| Connected projects | woww Framework and Velclaw-related infrastructure |

## Operational status policy

A repository link is not proof of a working deployment. Use the source repository's latest CI run, release, deployment record and health endpoint before marking a project operational. Keep these states separate:

- **Source available:** repository link is known.
- **CI verified:** relevant checks passed on the inspected commit.
- **Preview verified:** a specific Preview deployment was opened and tested.
- **Production verified:** production endpoint and release evidence were checked.
- **Not verified:** evidence is missing or stale.

Do not expose credentials, environment files, private keys, OAuth secrets, database contents or user data in this static directory.

## Cross-repository synchronization

The existing ecosystem sync workflow is PR-only. It copies only explicitly opted-in shared modules into .ocodejs/shared/; it does not rewrite app entrypoints or merge pull requests. Keep repository-specific code and backend state in their owning repositories.

## Deployment boundary

This work is prepared on a feature branch and Draft PR. It does not change main, merge a PR, alter DNS/CNAME, or initiate a Production deployment.
