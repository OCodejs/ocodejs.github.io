# OCodeJS Shared UI modules

Version: 0.1.0 · Framework-agnostic · Zero runtime dependencies

## Published sync payloads
- `design-system/tokens.css`: dark/light semantic tokens, typography, spacing, sharp-corner contract.
- `shared-ui/ui.css`: accessible buttons, fields, panels, cards, grid, navigation, mobile behavior.
- `navigation/navigation.js`: central navigation contract and safe DOM renderer. It does not authenticate users or manage sessions.

## Usage
```html
<link rel="stylesheet" href="/.ocodejs/shared/design-system/tokens.css">
<link rel="stylesheet" href="/.ocodejs/shared/shared-ui/ui.css">
<a class="oc-skip-link" href="#main">Skip to content</a>
<div id="ecosystem-nav"></div>
<script type="module">
  import { renderOcodejsNavigation } from "/.ocodejs/shared/navigation/navigation.js";
  renderOcodejsNavigation(document.querySelector("#ecosystem-nav"), { active: "discover" });
</script>
```

## Integration and security
- The central sync workflow copies each named module directory to `.ocodejs/shared/{module}/` and opens a target PR.
- Existing app routing, auth providers, sessions, APIs, databases, and framework styles remain application-owned.
- Account status links to the auth source repository only; it is not a sign-in flow and does not imply authentication readiness.
- Never put tokens, credentials, private environment variables, or session material in client code.
- Each target repository must explicitly opt into modules in the central registry and receive a dedicated PR.
- Test at 320px, 375px, 768px, and desktop widths; check keyboard focus and reduced-motion behavior.
