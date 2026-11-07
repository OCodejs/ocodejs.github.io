# OCode.js Profile API Contract (Proposed)

Status: design contract only. These routes are not deployed and must not be called by the UI until a staging implementation passes authorization and integration tests.

Base path: `/api/v1`. Browser mutations require an authenticated OCode.js Account session, CSRF protection and same-origin policy. Public reads return only public fields.

| Method | Route | Access | Purpose |
|---|---|---|---|
| GET | `/profiles/{username}` | Public | Read public profile and visible modules |
| POST | `/profiles/me` | Authenticated | Idempotently provision profile after account registration |
| PATCH | `/profiles/me` | Owner | Update editable profile fields |
| PUT | `/profiles/me/readme` | Owner | Replace Markdown README |
| PUT | `/profiles/me/pins` | Owner | Set up to six validated public resource pins |
| GET | `/profiles/{username}/repositories` | Public | Paginated public repositories |
| GET | `/profiles/{username}/projects` | Public | Paginated public projects |
| GET | `/profiles/{username}/packages` | Public | Paginated public packages |
| GET | `/profiles/{username}/stars` | Public | Paginated public stars |
| GET | `/profiles/{username}/activity` | Public | Paginated visible activity |
| GET | `/profiles/{username}/contributions?year={year}` | Public | Year-scoped contribution buckets |
| POST | `/profiles/{username}/follow` | Authenticated | Follow public profile |
| DELETE | `/profiles/{username}/follow` | Authenticated | Unfollow profile |
| GET | `/profiles/{username}/followers` | Public | Paginated followers |
| GET | `/profiles/{username}/following` | Public | Paginated following |
| GET | `/profiles/me/privacy` | Owner | Read privacy controls |
| PATCH | `/profiles/me/privacy` | Owner | Update privacy controls |

## Response conventions

- JSON; ISO-8601 UTC timestamps; stable machine-readable error codes.
- Cursor pagination: `items`, `nextCursor`, `hasMore`.
- Public responses must not include accountSubject, email, private provider IDs, encrypted token references or private resource metadata.
- A profile lookup returns 404 for unknown or non-public profiles where disclosure would leak account existence.
- Username conflicts return `USERNAME_TAKEN`; reserved names return `USERNAME_RESERVED`.
- Mutations require `X-CSRF-Token` and enforce an owner-to-profile relationship server-side.

## Example public profile response

```json
{
  "profile": {
    "username": "sample-user",
    "displayName": "Sample User",
    "avatarUrl": null,
    "bio": "Building with OCode.js",
    "websiteUrl": null,
    "location": null,
    "visibility": "public"
  },
  "stats": {
    "repositories": 0,
    "followers": 0,
    "following": 0
  },
  "modules": {
    "readme": true,
    "pinnedRepositories": true,
    "contributions": false,
    "activity": false
  }
}
```

The example is illustrative, not live data. Counts and module availability must come from authorized server-side queries.
