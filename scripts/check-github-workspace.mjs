import { readFile } from "node:fs/promises";
import vm from "node:vm";
import assert from "node:assert/strict";

const source = await readFile(new URL("../github/workspace.js", import.meta.url), "utf8");
const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const workflow = await readFile(new URL("../.github/workflows/autorun-control-api-tests.yml", import.meta.url), "utf8");

let registeredPage = null;
const sandbox = {
  window: {
    OCodeNavigation: {
      registerPage(page) { registeredPage = page; }
    }
  },
  document: { addEventListener() {} }
};

vm.runInNewContext(source, sandbox, { filename: "github/workspace.js" });
assert.ok(registeredPage, "GitHub Workspace must register with OCodeNavigation");
assert.equal(registeredPage.id, "github-workspace");
assert.equal(registeredPage.group, "DEVELOPER");

const markup = registeredPage.render();
for (const marker of [
  "GitHub Workspace", "ghRepoForm", "ghState", "ghPrList",
  "ghPrDetail", "ghBranches", "PUBLIC API"
]) {
  assert.ok(markup.includes(marker), "Workspace UI is missing: " + marker);
}

assert.match(source, /method:\s*'GET'/, "GitHub API requests must use GET");
assert.doesNotMatch(source, /method:\s*'(?:POST|PATCH|PUT|DELETE)'/,
  "GitHub Workspace must not perform write operations");
assert.doesNotMatch(source, /Authorization|GITHUB_TOKEN|ghp_/,
  "GitHub Workspace must not embed or request credentials");
assert.ok(html.includes('<script src="./github/workspace.js" defer></script>'),
  "Dashboard must load the GitHub Workspace module");
assert.ok(workflow.includes("node --check github/workspace.js"),
  "CI must syntax-check the GitHub Workspace module");
assert.ok(workflow.includes("node scripts/check-github-workspace.mjs"),
  "CI must run GitHub Workspace contract tests");

process.stdout.write("GitHub Workspace registration, render, read-only and integration checks passed.\n");
