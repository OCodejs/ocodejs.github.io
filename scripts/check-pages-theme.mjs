import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const root = new URL("../", import.meta.url);
const html = await readFile(new URL("index.html", root), "utf8");
const css = await readFile(new URL("ocodejs-pages-theme.css", root), "utf8");
const docs = await readFile(new URL("docs/ui-framework.md", root), "utf8");

assert.match(html, /<link rel="stylesheet" href="\.\/ocodejs-design-system\.css\?v=1\.0\.0">/, "Canonical design system must be linked");
assert.match(html, /<link rel="stylesheet" href="\.\/ocodejs-pages-theme\.css\?v=/, "Pages theme stylesheet must be linked");
const design = await readFile(new URL("ocodejs-design-system.css", root), "utf8");
for (const marker of ["--ocds-bg:#000", "--ocds-surface:#080808", "--ocds-border:#444", "--ocds-text:#f5f5f5", "--ocds-font:", ".ocds-btn", ".ocds-panel"]) assert.ok(design.includes(marker), "Missing canonical MCP design token or primitive: " + marker);
for (const token of [
  "--bg:#000", "--panel:#080808", "--line:#444", "--fg:#f5f5f5", "--muted:#aaa", "--ocds-version:\"1.0.0\""
]) assert.ok(css.includes(token), "Missing OCode.js CLI theme token: " + token);

for (const marker of [
  "@media(max-width:680px)", "env(safe-area-inset-bottom", "grid-template-columns:repeat(4",
  "prefers-reduced-motion", ".sidebar", ".nav button.active"
]) assert.ok(css.includes(marker), "Missing responsive/accessibility rule: " + marker);

for (const marker of ["mcp.ocodejs.dev", "Canonical design system adoption", "Layout contract", "Component contract"])
  assert.ok(docs.includes(marker), "UI framework documentation missing: " + marker);

for (const marker of [
  'id="mobileMenu"', 'aria-controls="sidebar"', 'aria-expanded="false"',
  'id="navScrim"', 'id="closeNav"', 'aria-hidden="true" inert', 'sidebar.inert=!open', 'id="workspaceNavigation"', 'function setNavigationOpen(open)', "navScrim.addEventListener('click'", "event.key==='Escape'", "setNavigationOpen(false);window.scrollTo"
]) assert.ok(html.includes(marker), "Navigation drawer contract missing: " + marker);
for (const marker of [
  ".sidebar.open{transform:translateX(0)", ".nav-scrim", "body.nav-open",
  ".drawer-head", ".mobile-menu{display:inline-flex!important"
]) assert.ok(css.includes(marker), "Navigation drawer theme rule missing: " + marker);

process.stdout.write("OCode.js Pages theme and scaffold checks passed.\n");

for (const marker of [
  'data-navigation-registry', 'const navigationRegistry=[', 'function registerNavigationItem(item)',
  'function registerWorkspacePage(page)', 'function renderNavigation()', 'window.OCodeNavigation',
  'registerItem:registerNavigationItem', 'registerPage:registerWorkspacePage',
  'root.innerHTML=groups.map', "id:'overview'", "id:'agents'", "id:'api'", "id:'auth'", "id:'mcp'", "id:'console'", "id:'docs'", 'renderNavigation();'
]) assert.ok(html.includes(marker), "Dynamic navigation registry missing: " + marker);

for (const marker of [
  "function serviceRegistryView()", "function refreshServiceRegistry()", "CONTROL_API_BASE+'/services'",
  "function providersView()", "function refreshProviders()", "CONTROL_API_BASE+'/providers'",
  "function runtimeView()", "function refreshRuntime()", "CONTROL_API_BASE+'/runtime/status'",
  "id:'service-registry'", "id:'providers'", "id:'runtime'",
  "serviceRegistryView,providers:providersView,runtime:runtimeView",
  "if(key==='service-registry')refreshServiceRegistry()", "if(key==='providers')refreshProviders()", "if(key==='runtime')refreshRuntime()"
]) assert.ok(html.includes(marker), "Live platform page missing: " + marker);
