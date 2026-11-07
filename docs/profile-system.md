# OCode.js Profile — Multi-user Product Specification

## Product definition

OCode.js Profile is a first-class account feature for every registered OCode.js user. It is not a single organization README and must not be implemented as one GitHub special repository per customer.

Canonical public route: `/ @username` without the space (proposed URL form: `/@username`). The route is a stable public handle, not an account ID. Usernames are unique, normalized, reserved-word protected and immutable or changed only through a guarded rename flow with redirects.

## Account and identity boundary

- The OCode.js Account service is the identity provider and source of the immutable account subject.
- A profile is created transactionally or idempotently after successful account registration.
- Profile records reference the account subject; never key ownership by an email address.
- Only the authenticated owner can edit their profile, pinned repositories, README, links and visibility settings.
- Public profile reads expose only explicitly public fields. Email is private by default.
- Staff/admin access is audited and must not silently bypass profile privacy.
- GitHub is an optional linked provider/data source, not the identity authority for OCode.js accounts.
- Do not enable profile writes until the Account Portal has a verified database, sessions, CSRF protection and authorization.

## Information architecture

1. Overview — profile README, pinned repositories, contribution activity and recent activity.
2. Repositories — public repositories linked/imported from connected GitHub or OCode.js projects.
3. Projects — public projects owned or shared by the user.
4. Packages — published packages owned by the user.
5. Stars — repositories/projects the user has starred.

The profile header/sidebar contains avatar, display name, username, status, bio, location, timezone, website, public social links, follower/following counts and owner actions (Edit profile, Follow, Sponsor where enabled).

Additional Overview modules:
- Achievements and organizations, shown only when earned/membership is verified.
- Markdown profile README with sanitized rendering and safe outbound links.
- Up to six pinned repositories, with language, description, stars and forks.
- Contribution heatmap with year selection and accessible textual summary.
- Activity timeline for commits, pull requests, issues and project events; paginate with a bounded cursor.

## Data model (logical)

- Profile: id, accountSubject (unique FK), username (unique normalized), displayName, avatarUrl, bio, statusText, location, timezone, websiteUrl, visibility, createdAt, updatedAt.
- ProfileLink: id, profileId, kind, label, url, visibility, sortOrder.
- ProfileReadme: profileId (unique), markdown, renderedAt, updatedAt.
- ProfilePin: profileId, resourceType, resourceId, sortOrder; unique profile/resource and max six active pins.
- Follow: followerProfileId, followedProfileId, createdAt; unique pair, no self-follow.
- ProfileEvent: id, profileId, actorSubject, eventType, resourceRef, visibility, occurredAt; append-only event projection with retention policy.
- Achievement: id, profileId, achievementKey, earnedAt, evidenceRef; server-issued only.
- GitHubConnection: accountSubject, providerAccountId, encrypted token reference, scopes, connectedAt; secrets remain server-side.

Use the existing account database only after its ownership and schema are verified. Do not create a second identity table or duplicate passwords. Add migrations through a reviewed staging PR.

## Security and privacy requirements

- Enforce owner authorization server-side on every mutation; hiding edit controls is not authorization.
- Validate username syntax, reserved names, Unicode normalization and case-insensitive uniqueness.
- Sanitize Markdown to prevent XSS; disable raw HTML or use a strict allowlist.
- Validate outbound URLs and reject javascript:, data:, file: and private-network targets.
- Never expose provider tokens, email, private repositories, hidden activity or internal account IDs in public APIs.
- Rate-limit profile creation, edits, follow actions and search.
- Protect mutations against CSRF; use secure, HttpOnly, SameSite cookies and explicit origin checks.
- Use cursor pagination and bounded response sizes for activity, followers and repository lists.
- Audit username changes, privacy changes, staff access and account deletion.
- Account deletion must cascade/anonymize profile data according to the published retention policy.
- Add abuse controls: block/report, follow limits, profile slug reservations and moderation state.

## Delivery phases

### P0 — Product contract and UI prototype
- Lock route, profile sections, data ownership, privacy defaults and API shape.
- Build a static preview with clearly labeled sample data.
- No fake login, fake writes, or claims of persisted data.

### P1 — Account integration (staging only)
- Verify Account Portal repository, database, session callbacks and account subject contract.
- Add idempotent profile provisioning and unique username reservation.
- Add owner-only profile read/update endpoints and integration tests.
- Test registration, login, edit, logout and unauthorized access end-to-end.

### P2 — Public profile and social graph
- Public profile rendering, README sanitizer, pinned resources, followers/following.
- Add block/report, privacy controls, pagination and cache invalidation.

### P3 — Activity and integrations
- Contribution aggregation and activity timeline from authorized event sources.
- Optional GitHub connection with least-privilege scopes and revocation.
- Achievements and organizations backed by verifiable evidence.

### P4 — Release readiness
- Accessibility, responsive browser tests, threat model, abuse testing, backups and rollback.
- Production remains disabled until explicit approval.

## Non-goals

- Do not create one GitHub repository per OCode.js user.
- Do not require GitHub to register or use an OCode.js Profile.
- Do not infer achievements, contribution counts or organization membership from client input.
- Do not copy GitHub's private contribution/activity data into public profiles.
- Do not represent sample data as live user data.
