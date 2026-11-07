# OCode.js managed shared assets

This directory is the source payload distributed by the central OCode.js ecosystem repository.

## Contract

- Only files in this directory are copied to opted-in repositories.
- Targets receive files under `.ocodejs/shared/`.
- The sync workflow creates a branch and pull request; it never merges or deploys.
- Repository-specific source, routes, API handlers, authentication, database schemas, environment files, and secrets are out of scope.
- Add a module to a target only after auditing its framework and integration path in `projects.registry.json`.

## Adding a shared module

1. Add the source module below this directory.
2. Update the target repository's `sync.modules` in `projects.registry.json`.
3. Run the workflow in dry-run mode.
4. Review generated diffs and PRs before merging.
