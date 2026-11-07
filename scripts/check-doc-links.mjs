import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const markdownFiles = ["README.md"];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.isFile() && entry.name.endsWith(".md")) markdownFiles.push(path.relative(root, full));
  }
}
await walk(path.join(root, "docs"));

const failures = [];
let checked = 0;
const codeFence = String.fromCharCode(96).repeat(3);
for (const file of markdownFiles) {
  const raw = await readFile(path.join(root, file), "utf8");
  const source = raw.split(codeFence).filter((_, index) => index % 2 === 0).join("");
  for (const match of source.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    let target = match[1].trim().split(/\s+/)[0].replace(/^<|>$/g, "");
    if (!target || target.startsWith("#") || /^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(target)) continue;
    target = decodeURIComponent(target.split(/[?#]/)[0]);
    if (!target) continue;
    const candidate = path.resolve(target.startsWith("/") ? root : path.dirname(path.join(root, file)), target.replace(/^\//, ""));
    if (!candidate.startsWith(root + path.sep) && candidate !== root) {
      failures.push(file + " -> " + target + " (outside repository)");
      continue;
    }
    const candidates = [candidate];
    if (!path.extname(candidate)) candidates.push(candidate + ".md", candidate + ".html", path.join(candidate, "index.md"), path.join(candidate, "index.html"));
    let found = false;
    for (const item of candidates) {
      try { await access(item); found = true; break; } catch {}
    }
    checked += 1;
    if (!found) failures.push(file + " -> " + target);
  }
}

assert.deepEqual(failures, [], failures.join("\n"));
process.stdout.write("Local Markdown link checks passed (" + checked + " links across " + markdownFiles.length + " files).\n");
