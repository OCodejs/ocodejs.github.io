# OCode.js Pages — UI framework and theme

This repository uses the same visual language and responsive shell as the public `zskbot/ocodejs-cli` Pages experience. The implementation is deliberately framework-light: semantic HTML, CSS custom properties and the existing vanilla JavaScript view router.

## Source of truth

- **Canonical visual reference:** https://mcp.ocodejs.dev/ (the MCP page at `/pages/mcp.html` is the visual authority).
- Reference source: https://github.com/zskbot/ocodejs-cli/blob/main/pages/mcp.html
- Reference shell: `pages/mcp.html` (black canvas, monochrome borders/text, system monospace typography, square geometry).
- Server Control Center shell: `index.html`
- Shared design tokens/primitives: `ocodejs-design-system.css`
- Shared application shell/theme: `ocodejs-pages-theme.css`

The theme is a companion layer. It does not replace the existing Control API, view renderers, service probes, modal behavior or MCP client code.

## Scaffold

```text
/
├── index.html                    # App shell + existing view router
├── ocodejs-design-system.css     # Canonical MCP tokens and reusable primitives (v1.0.0)
├── ocodejs-pages-theme.css       # Shared application shell and responsive behavior
├── docs/
│   ├── ui-framework.md           # This architecture contract
│   ├── api-contract.md
│   ├── architecture.md
│   └── ...
├── scripts/                      # Static validation and smoke checks
└── workers/
    └── control-api/               # Cloudflare staging Control API
```

## Design tokens

| Token | Value | Usage |
|---|---|---|
| `--ocds-bg` | `#000` | Canonical page canvas |
| `--ocds-surface` | `#080808` | Panels and cards |
| `--ocds-border` | `#444` | Structural borders |
| `--ocds-border-strong` | `#777` | Buttons and controls |
| `--ocds-text` | `#f5f5f5` | Primary text |
| `--ocds-muted` | `#aaa` | Secondary text |
| `--ocds-font` | System monospace stack | All typography |
| `--ocds-radius` | `0` | Square geometry |
| `--ocds-space-unit` | `4px` | Base spacing unit |

Spacing uses a 4px base scale. Corners remain square. The canonical MCP page is monochrome; do not introduce product-specific accent palettes, rounded cards, gradients or remote fonts. Semantic status indicators may use text labels, but must not change the core palette.

## Layout contract

- Desktop and mobile: one global three-line hamburger control opens the same left-side navigation drawer; sticky topbar and fluid content canvas.
- The drawer has a backdrop, explicit close control, Escape-to-close, active-page indication, focus handling, and `aria-hidden`/`inert` while closed.
- Mobile: drawer respects iOS safe-area insets; content and metric grids reflow to a single column; no duplicate bottom navigation.
- Touch controls remain at least 38–42px high.
- Tables retain horizontal scrolling rather than shrinking columns into unreadable text.
- Reduced-motion preference disables non-essential transitions.

## Navigation registry contract

The workspace menu is generated from the central `navigationRegistry` in `index.html`; navigation buttons must not be duplicated as static HTML. The seven existing destinations are registered once and rendered into grouped sections.

Register a new view and it is added to the menu automatically:

```js
window.OCodeNavigation.registerPage({
  id: "billing",
  title: "Billing",
  icon: "$",
  group: "PLATFORM",
  render: () => billingView()
});
```

For an action-only menu entry, register a callback:

```js
window.OCodeNavigation.registerItem({
  id: "refresh-data",
  label: "Refresh data",
  icon: "↻",
  group: "ACTIONS",
  onSelect: () => refreshData()
});
```

IDs must be lowercase route-safe identifiers (`a-z`, `0-9`, hyphens; first character a letter). Labels and icons are escaped before rendering. Use `registerPage` for navigable screens; use `registerItem` only for menu actions. Existing IDs are updated in place instead of duplicated.

## Component contract

Existing components keep their behavior and receive the shared theme: `.panel`, `.stat`, `.btn`, `.state`, `.service`, `.tile`, `.doc`, `.table`, `.notice`, and `.log`. Status colors must represent actual API states only; preview or unavailable data must not be styled as healthy.

## Change policy

1. Add new design values as CSS variables before introducing one-off colors.
2. Keep the existing API and authentication semantics independent from presentation.
3. Keep mobile navigation reachable above the iOS home indicator.
4. Do not put credentials, provider tokens or runtime secrets in HTML, CSS or browser storage.
5. Run the repository validation and Control API tests before merging.


## Live Control Center pages

The workspace includes read-only operational views backed by the staging Control API:

- **Service Registry** — `GET /api/v1/services`; displays per-service state, probe source, latency when supplied, and request/check metadata.
- **Provider Registry** — `GET /api/v1/providers`; displays catalog metadata and explicitly indicates whether inference is configured or disabled.
- **AI Runtime** — `GET /api/v1/runtime/status`; displays provider, run-store, inference and agent-execution readiness.

These pages are registered in the same navigation registry as the original seven sections. Their Refresh controls perform fresh `GET` requests with `cache: no-store`. Errors are shown as errors; the UI does not substitute sample data or claim an unavailable service is healthy.

No write or deployment action is exposed by these views. Provider inference and agent execution remain disabled until server-side bindings, a run store, quota enforcement, authentication and explicit approval controls are in place.


## Canonical design system adoption

All OCode.js ecosystem Pages must use the MCP page as the single visual source of truth. Import the shared stylesheet before application-specific CSS:

```html
<link rel="stylesheet" href="https://raw.githubusercontent.com/OCodejs/ocodejs.github.io/main/ocodejs-design-system.css">
```

For production consumers, pin a release tag rather than tracking `main`. The Control Center pairs this base layer with `ocodejs-pages-theme.css`; product-specific styles may add layout and behavior but must not redefine the canonical tokens.

The canonical reference is `https://mcp.ocodejs.dev/pages/mcp.html`. If the reference page changes, update the tokens and version here first, validate the Control Center, then migrate downstream Pages in separate reviewed changes. Never overwrite a downstream app's routes, API contracts, authentication, or business logic as part of a visual migration.
