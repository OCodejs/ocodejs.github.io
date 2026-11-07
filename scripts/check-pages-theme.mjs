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

process.stdout.write("OCode.js Pages theme and scaffold checks passed.\n");
