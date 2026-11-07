import fs from "node:fs";

const registry = JSON.parse(fs.readFileSync("projects.registry.json", "utf8"));
const allowedModules = new Set(["design-system", "shared-ui", "navigation", "project-catalog"]);
const errors = [];

if (registry.organization !== "OCodejs") errors.push("organization must be OCodejs");
if (registry.controlRepository !== "OCodejs/ocodejs.github.io") errors.push("controlRepository must point to the central repository");
if (!Array.isArray(registry.repositories) || registry.repositories.length !== 38) {
  errors.push("expected the 38 repositories currently visible in the OCodejs organization");
}

const seen = new Set();
for (const item of registry.repositories ?? []) {
  if (!/^OCodejs\/[A-Za-z0-9._-]+$/.test(item.repository ?? "")) {
    errors.push(`invalid repository name: ${item.repository}`);
  }
  if (seen.has(item.repository)) errors.push(`duplicate repository: ${item.repository}`);
  seen.add(item.repository);

  if (!item.defaultBranch) errors.push(`missing defaultBranch: ${item.repository}`);
  if (!Array.isArray(item.sync?.modules)) errors.push(`sync.modules must be an array: ${item.repository}`);
  for (const module of item.sync?.modules ?? []) {
    if (!allowedModules.has(module)) errors.push(`unsupported module "${module}" in ${item.repository}`);
  }
  if (item.sync?.enabled && (item.sync.modules?.length ?? 0) === 0) {
    errors.push(`sync enabled without modules: ${item.repository}`);
  }
  if (item.repository === registry.controlRepository && item.sync?.enabled) {
    errors.push("central repository must not sync to itself");
  }
}

if (errors.length) {
  console.error(errors.map((e) => `- ${e}`).join("\n"));
  process.exit(1);
}
console.log(`Project Registry valid: ${seen.size} unique repositories; module opt-in rules passed.`);
