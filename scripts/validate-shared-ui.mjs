import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [tokens, ui, nav, manifest, registryText, hub, home] = await Promise.all([
  read("../ecosystem/shared/modules/design-system/tokens.css"),
  read("../ecosystem/shared/modules/shared-ui/ui.css"),
  read("../ecosystem/shared/modules/navigation/navigation.js"),
  read("../ecosystem/shared/modules/package.json"),
  read("../projects.registry.json"),
  read("../ecosystem/index.html"),
  read("../index.html")
]);
const pkg = JSON.parse(manifest);
const registry = JSON.parse(registryText);
assert.equal(pkg.name, "@ocodejs/shared-ui");
assert.ok(tokens.includes("--oc-bg:"));
assert.ok(tokens.includes("--oc-accent:"));
assert.ok(tokens.includes("--oc-radius:0"));
assert.ok(ui.includes(".oc-button") && ui.includes(":focus-visible"));
assert.ok(ui.includes("prefers-reduced-motion"));
assert.ok(!/border-radius\s*:\s*(?!0(?:\s|;|$))[^;]+/i.test(ui));
assert.ok(nav.includes("preview-unverified"));
assert.ok(nav.includes("renderOcodejsNavigation"));
assert.equal(registry.repositories.length, 76);
assert.equal(new Set(registry.repositories.map((item) => item.repository.toLowerCase())).size, 76);
assert.ok(hub.includes("../ecosystem/shared/modules/design-system/tokens.css"));
assert.ok(hub.includes("Account status"));
assert.ok(home.includes("./ecosystem/shared/modules/shared-ui/ui.css"));
assert.ok(home.includes("Account service status"));
console.log("OCodeJS shared UI contract: PASS");
console.log("Registry coverage: 76 unique repositories");
