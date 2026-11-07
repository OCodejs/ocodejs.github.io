import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const root = new URL("../", import.meta.url);
const html = await readFile(new URL("index.html", root), "utf8");
const css = await readFile(new URL("ocodejs-pages-theme.css", root), "utf8");
const docs = await readFile(new URL("docs/ui-framework.md", root), "utf8");

assert.match(html, /<link rel="stylesheet" href="\.\/ocodejs-pages-theme\.css\?v=/, "Pages theme stylesheet must be linked");
for (const token of [
  "--bg:#05070d", "--panel:#0a101c", "--blue:#347cff", "--cyan:#55c8ff",
  "--purple:#a34cff", "--green:#57d6a2", "--space-1:4px"
]) assert.ok(css.includes(token), "Missing OCode.js CLI theme token: " + token);

for (const marker of [
  "@media(max-width:680px)", "env(safe-area-inset-bottom", "grid-template-columns:repeat(4",
  "prefers-reduced-motion", ".sidebar", ".nav button.active"
]) assert.ok(css.includes(marker), "Missing responsive/accessibility rule: " + marker);

for (const marker of ["zskbot/ocodejs-cli", "Layout contract", "Component contract"])
  assert.ok(docs.includes(marker), "UI framework documentation missing: " + marker);

for (const marker of [
  'id="mobileMenu"', 'aria-controls="sidebar"', 'aria-expanded="false"',
  'id="navScrim"', 'id="closeNav"', 'aria-hidden="true" inert', 'sidebar.inert=!open', 'data-view="overview"', 'data-view="agents"',
  'data-view="api"', 'data-view="auth"', 'data-view="mcp"', 'data-view="console"',
  'data-view="docs"', 'function setNavigationOpen(open)', "navScrim.addEventListener('click'", "event.key==='Escape'", "setNavigationOpen(false);window.scrollTo"
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
  'root.innerHTML=groups.map', 'renderNavigation();'
]) assert.ok(html.includes(marker), "Dynamic navigation registry missing: " + marker);
