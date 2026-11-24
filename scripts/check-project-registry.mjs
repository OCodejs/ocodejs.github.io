import fs from "node:fs";
import path from "node:path";

const registry = JSON.parse(fs.readFileSync("projects.registry.json", "utf8"));
const allowedModules = new Set(["design-system", "shared-ui", "navigation", "project-catalog"]);
const allowedKinds = new Set(["application", "service", "documentation", "skills", "shared-library", "example-reference", "upstream-fork", "dependency", "framework", "platform", "template", "organization-config"]);
const errors = [];

if (registry.organization !== "OCodejs") errors.push("organization must be OCodejs");
if (registry.controlRepository !== "OCodejs/ocodejs.github.io") errors.push("controlRepository must point to the central repository");
if (!Array.isArray(registry.repositories) || registry.repositories.length === 0) errors.push("repositories must be a non-empty array");
if (registry.audit?.organizationRepositoryCount !== registry.repositories?.length) errors.push("audit.organizationRepositoryCount must match the repository registry length");

const seen = new Set();
for (const item of registry.repositories ?? []) {
  const key = (item.repository ?? "").toLowerCase();
  if (!/^OCodejs\/[A-Za-z0-9._-]+$/i.test(item.repository ?? "")) errors.push(`invalid repository name: ${item.repository}`);
  if (seen.has(key)) errors.push(`duplicate repository (case-insensitive): ${item.repository}`);
  seen.add(key);
  if (!item.defaultBranch) errors.push(`missing defaultBranch: ${item.repository}`);
  if (!allowedKinds.has(item.kind)) errors.push(`unsupported kind "${item.kind}" in ${item.repository}`);
  if (!Array.isArray(item.sync?.modules)) errors.push(`sync.modules must be an array: ${item.repository}`);
  for (const module of item.sync?.modules ?? []) {
    if (!allowedModules.has(module)) errors.push(`unsupported module "${module}" in ${item.repository}`);
    const payload = path.join("ecosystem/shared/modules", module);
    if (!fs.existsSync(payload) || !fs.statSync(payload).isDirectory()) errors.push(`missing shared module payload "${payload}"`);
  }
  if (item.sync?.enabled && (item.sync.modules?.length ?? 0) === 0) errors.push(`sync enabled without modules: ${item.repository}`);
  if (item.repository.toLowerCase() === registry.controlRepository.toLowerCase() && item.sync?.enabled) errors.push("central repository must not sync to itself");
}
if (errors.length) {
  console.error(errors.map((e) => `- ${e}`).join("\n"));
  process.exit(1);
}
console.log(`Project Registry valid: ${seen.size} unique repositories; shared module payloads and opt-in rules passed.`);
