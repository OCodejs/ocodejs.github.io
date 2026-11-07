# OCode.js Design System module

Version: 1.0.0

Canonical visual reference: https://mcp.ocodejs.dev/pages/mcp.html

This stylesheet is derived from the canonical MCP page design tokens. It provides the monochrome palette, typography, square geometry, spacing primitives, shared utility classes, focus-visible behavior, and reduced-motion handling.

## Integration

Load this file from the application after confirming its existing CSS cascade:

```html
<link rel="stylesheet" href="/.ocodejs/shared/design-system/ocodejs-design-system.css">
```

The sync engine only places this managed asset in the repository. It does not edit application HTML, framework entrypoints, routes, or component styles. Each app requires a separate reviewed integration PR.
