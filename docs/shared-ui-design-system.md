# OCodeJS Shared UI and Design System

## Purpose
Provide one framework-agnostic visual contract for OCodeJS applications without turning independent applications into a monolith.

## Canonical source
- Tokens: `ecosystem/shared/modules/design-system/tokens.css`
- Primitives: `ecosystem/shared/modules/shared-ui/ui.css`
- Navigation contract: `ecosystem/shared/modules/navigation/navigation.js`

## Visual language
- Default dark palette: `#05070f` background, `#0a0d16` elevated surfaces, `#f3f5fb` foreground.
- Accent: `#2f6bff`, secondary accent: `#8b5cf6`.
- JetBrains Mono preferred for developer-facing UI; system sans is available for content-heavy surfaces.
- Controls use zero border radius. Do not introduce pills or rounded cards.
- Thin borders, high contrast, restrained accents, compact technical hierarchy.

## Accessibility and responsive behavior
- Visible keyboard focus, semantic navigation labels, current-page state, skip link.
- Reduced-motion support.
- Mobile navigation adapts at 640px; integration tests should cover 320/375/768/desktop widths.
- Product pages must retain semantic headings, labels, and keyboard-accessible controls.

## Account boundary
The shared navigation exposes an Account status/source link only. Authentication remains owned by the dedicated account service. Never copy auth secrets, session cookies, OAuth client secrets, or database credentials into static sites or shared assets. Do not represent the Account Portal as ready until provider callbacks, session persistence, logout, and recovery are tested in a dedicated Preview.

## Adoption policy
1. Audit repository language, framework, build, test, license, and deployment.
2. Opt into only compatible modules in the registry.
3. Open a dedicated PR for each target repository.
4. Run target CI and Preview; inspect mobile and desktop.
5. Do not merge or deploy Production without explicit approval.
