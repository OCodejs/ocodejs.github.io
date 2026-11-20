# GitHub Repository Operations Center

The GitHub Workspace is a browser-side, read-only view for public repositories.

## Features
- Repository metadata and public branch listing.
- Branch comparison with ahead/behind counts, commit totals and changed-file statistics.
- Recent commit history with author, timestamp and canonical GitHub links.
- Recursive Git tree explorer with directory navigation and bounded text-file preview.
- Aggregated CI overview from commit check-runs, legacy commit statuses and workflow runs.

## Security boundary
- All GitHub requests are HTTP GET requests to the public GitHub REST API.
- No OAuth flow, PAT input, token storage, browser storage, mutation endpoint, workflow dispatch, or write operation is included.
- Private repositories are rejected. Do not add a token to this page.
- File preview is limited to 180 KB and binary content is not rendered.
- The unauthenticated GitHub API rate limit applies; errors are displayed rather than replaced with cached or fabricated state.
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
