# OCode.js Ecosystem Registry

## Control plane

`OCodejs/ocodejs.github.io` is the control repository. `projects.registry.json` inventories the 38 repositories returned by the GitHub organization search at implementation time.

The registry records each repository's default branch, visibility, purpose, and explicit shared-module opt-in. Repository descriptions are provisional classifications based on repository names and known project context; they are not a substitute for a source audit.

## Synchronization model

1. Publish reusable code under `ecosystem/shared/modules/<module>/`.
2. Add that module to the target repository's `sync.modules` list.
3. The workflow validates the registry and copies only opted-in module directories.
4. A branch and pull request are created in each target repository.
5. A maintainer reviews and merges each PR independently.

Targets receive managed files under `.ocodejs/shared/<module>/`. The sync engine does not rewrite application entrypoints or import statements. Each application must integrate the managed module through its own reviewed adapter.

## GitHub Actions credential

For cross-repository writes, configure the repository Actions secret `OCODEJS_SYNC_TOKEN` in the control repository. Use a fine-grained token restricted to the intended OCodejs repositories with:

- Contents: Read and write
- Pull requests: Read and write
- Metadata: Read-only

Do not place the token in source code, registry JSON, workflow literals, commits, or chat. If the secret is absent, the workflow validates the registry and skips cross-repository writes.

## Safety boundaries

- PR-only; never auto-merge.
- No Production deployment.
- Never copy secrets, environment files, database data, auth providers, API routes, or project-specific business logic.
- Only paths below `.ocodejs/shared/` are managed by this workflow.
- Dependencies, samples, experiments, and unclassified repositories remain excluded until audited and explicitly opted in.
- The registry must be updated when repositories are added, renamed, archived, or transferred.

## Current scope

The registry includes 38 repositories in the OCodejs organization. Application, framework, and documentation repositories have provisional module opt-ins. Upstream dependencies, samples, experiments, skills, organization configuration, and unclassified repositories are excluded from automatic code sync.
