# OCodeJS business content synchronization

## Data ownership

- Source of truth: `OCodejs/OCODEJS`.
- Curated organization and project metadata: `business/manifest.json`.
- Articles: `_articles/**/*.md` with YAML frontmatter.
- Generated central snapshot: `business-sync/manifest.json` and `business-sync/articles/*.md`.
- Read-only presentation: `business/index.html`.

## Automation

The `business-content-sync.yml` workflow polls the public source every 30 minutes and can also be run manually. It validates the manifest, checks unique project/article IDs, imports Markdown, and updates the stable branch `bot/business-content-sync`. A Draft PR is opened or updated for human review. It never merges or deploys.

## Add or update content

1. Add/update a project in the source `business/manifest.json`, or add/update Markdown under `_articles/`.
2. Commit to the source repository default branch.
3. Wait for the next scheduled poll or manually run the central workflow.
4. Review the Draft PR in `OCodejs/ocodejs.github.io`.
5. Merge only after review. GitHub Pages deployment remains governed by the repository's existing settings.

No token is copied from the source repository. The importer clones only the public source repository.
