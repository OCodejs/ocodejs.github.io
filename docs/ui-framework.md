# OCode.js Pages — UI framework and theme

This repository uses the same visual language and responsive shell as the public `zskbot/ocodejs-cli` Pages experience. The implementation is deliberately framework-light: semantic HTML, CSS custom properties and the existing vanilla JavaScript view router.

## Source of truth

- Reference implementation: https://github.com/zskbot/ocodejs-cli
- Reference shell: `index.html` and `_layouts/default.html`
- Server Control Center shell: `index.html`
- Shared theme layer: `ocodejs-pages-theme.css`

The theme is a companion layer. It does not replace the existing Control API, view renderers, service probes, modal behavior or MCP client code.

## Scaffold

```text
/
├── index.html                    # App shell + existing view router
├── ocodejs-pages-theme.css       # Shared OCode.js Pages design tokens and responsive shell
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
| `--bg` | `#05070d` | App canvas |
| `--panel` | `#0a101c` | Cards and panels |
| `--line` | `#26364f` | Structural borders |
| `--line-strong` | `#36577f` | Interactive borders |
| `--fg` | `#f2f5fb` | Primary text |
| `--muted` | `#a3afc2` | Secondary text |
| `--blue` | `#347cff` | Primary action |
| `--cyan` | `#55c8ff` | Focus and highlights |
| `--purple` | `#a34cff` | Secondary accent |
| `--green` | `#57d6a2` | Healthy state |

Spacing uses a 4px base scale. Corners remain square to match the CLI Hub. Typography uses a system monospace stack and does not require a remote font request.

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
