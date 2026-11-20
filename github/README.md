# GitHub Workspace

The Server Control Center includes a browser-side, read-only explorer for public GitHub repositories.

## Capabilities

- Load public repository metadata by `owner/repository`.
- List up to 50 branches and up to 50 Pull Requests, sorted by most recently updated.
- Filter Pull Requests by title, number, author and source/target branch.
- Inspect Pull Request metadata, review summaries and commit check runs.
- Open the canonical Pull Request and diff pages on GitHub.

## Security and limits

- Uses only unauthenticated `GET` requests to `api.github.com`.
- Does not request a PAT, OAuth token, GitHub App installation or browser credential.
- Does not create, update, close, approve, merge or comment on repositories or Pull Requests.
- Does not dispatch workflows, write repository settings or access private repositories.
- GitHub's unauthenticated API rate limit applies. The UI reports rate-limit responses and does not attempt a credential workaround.
- Only enter public repository names. Do not paste tokens, secrets or private repository URLs.

## Local validation

Run:

```sh
node --check github/workspace.js
node scripts/check-github-workspace.mjs
```
