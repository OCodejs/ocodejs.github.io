# GitHub Repository Operations Center

The GitHub Workspace is a browser-side, read-only view for public repositories.

## Features
- Repository metadata and public branch listing.
- Organization Repository Inventory: public repositories with visibility, default branch, primary language and last update timestamp. Private repositories are not exposed by the unauthenticated browser API.
- Pull Request Center: up to 30 recently updated PRs, with review state, mergeability and checks fetched for up to 12 PRs per refresh.
- Security & Permissions: proposed Viewer / Developer / Admin capability matrix and GitHub App authentication architecture. This is design documentation only; no roles are provisioned and no write capabilities are enabled.
- Branch comparison with ahead/behind counts, commit totals and changed-file statistics.
- Recent commit history with author, timestamp and canonical GitHub links.
- Recursive Git tree explorer with directory navigation and bounded text-file preview.
- Aggregated CI overview from commit check-runs, legacy commit statuses and workflow runs.

## Security boundary
- All GitHub requests are HTTP GET requests to the public GitHub REST API.
- No OAuth flow, PAT input, token storage, browser storage, mutation endpoint, workflow dispatch, or write operation is included.
- Private repositories are rejected. Do not add a token to this page.
- File preview is limited to 180 KB and binary / invalid UTF-8 content is not rendered.
- GitHub API requests have a 15-second timeout; branch enumeration is bounded to 1,000 branches and tree rendering is bounded to 5,000 entries / 500 visible entries per directory.
- External links are restricted to HTTP(S), and stale file / comparison / inventory responses are ignored when the active selection changes.
- The unauthenticated GitHub API rate limit applies. PR review/check details are bounded to 12 PRs per refresh; errors are displayed rather than replaced with cached or fabricated state.
- Inventory uses the public organization repositories endpoint for the selected repository owner; it does not claim to enumerate private repositories or all personal-account resources.
- Audit log is not connected. The UI documents a future append-only event schema but does not create or display fabricated events.
- Repository names are validated as owner/repository and all API-derived text is HTML-escaped before rendering.

## Before enabling private-repository or write access
Implement a server-side GitHub App/OIDC integration with:
1. Explicit organization/repository installation allowlists.
2. User identity and server-side RBAC (viewer, developer, admin) scoped to repository and environment.
3. Short-lived installation tokens kept server-side only.
4. CSRF protection, request validation, rate limits and audit events.
5. Separate read and write capabilities; destructive or deployment actions require step-up approval.
6. An allowlisted API proxy. Never proxy arbitrary URLs supplied by the browser.

Until those controls are deployed and independently reviewed, this workspace must remain read-only.

## Current implementation limits
- Inventory is scoped to the organization endpoint derived from the selected repository owner and returns at most 100 repositories per request.
- Pull Request Center returns at most 30 PRs and enriches at most 12 with reviews, check-runs and legacy commit statuses. `Unknown` / `Not loaded` means GitHub did not provide a verified value; it is not treated as success.
- GitHub App installation, OAuth identity binding, RBAC enforcement, audit persistence and all write operations remain unimplemented by design.

## Review remediation update
- Replaced dynamic `innerHTML` / `insertAdjacentHTML` writes with a centralized inert DOMParser-to-DOM import helper. All API-derived text remains HTML-escaped before parsing; external targets are limited to HTTP(S), and unsafe CI URLs render as non-clickable text.
- Invalidated in-flight inventory, PR, file, and comparison requests whenever the repository target changes; repository panels are reset at load start and replaced with an error state on failure.
- Added a 15-second API timeout, strict UTF-8 decoding for previews, branch/repository inventory pagination (bounded at 1,000 items), and explicit cap warnings for large comparisons.
- CI aggregates check runs, commit statuses, and workflow runs. Check-runs use GitHub's maximum 100-per-page response; if GitHub reports more checks than returned, the headline is marked partial. Workflow and commit-status failures are included in PR-level check classification.
- Browser smoke test and full live GitHub API interaction test remain pending. No CI workflow was dispatched manually.
