# OCodeJS Shared UI modules

Version: 1.0.0  
Runtime dependencies: none  
Framework: framework-agnostic CSS + browser ES module

## Files
- `design-tokens.css`: dark/light semantic tokens, typography, spacing, sharp-corner contract.
- `shared-ui.css`: accessible buttons, fields, panels, cards, grid, navigation, mobile behavior.
- `navigation.js`: central navigation contract and safe DOM renderer. It does not authenticate users or manage sessions.

## Usage
```html
<link rel="stylesheet" href="/ecosystem/shared/modules/design-tokens.css">
<link rel="stylesheet" href="/ecosystem/shared/modules/shared-ui.css">
<a class="oc-skip-link" href="#main">Skip to content</a>
<div id="ecosystem-nav"></div>
<script type="module">
  import { renderOcodejsNavigation } from "/ecosystem/shared/modules/navigation.js";
  renderOcodejsNavigation(document.querySelector("#ecosystem-nav"), { active: "discover" });
</script>
```

## Integration and security
- Existing app routing, auth providers, sessions, APIs, databases, and framework styles remain application-owned.
- Account status currently links to the auth source repository only; it is not a sign-in flow and does not imply that authentication is ready.
- Do not put tokens, credentials, private environment variables, or session material in client code.
- Each target repository must explicitly opt into modules in the central registry and receive a dedicated PR.
- Test at 320px, 375px, 768px, and desktop widths; check keyboard focus and reduced-motion behavior.
