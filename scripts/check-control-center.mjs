import { readFile } from "node:fs/promises";
import vm from "node:vm";
import assert from "node:assert/strict";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const match = html.match(/<script>([\\s\\S]*?)<\\/script>/);
assert.ok(match, "Control Center inline application script must exist");
new vm.Script(match[1], { filename: "index.html:inline-script" });

for (const marker of [
  "CONTROL_API_BASE",
  "refreshDashboard",
  "api/v1/health/live",
  "api/v1/health/ready",
  "api/v1/services",
  "Không có dữ liệu xác thực",
  "API UNREACHABLE"
]) {
  assert.ok(html.includes(marker), `Control Center is missing required integration marker: ${marker}`);
}

assert.ok(!html.includes("DEMO / FRONTEND PREVIEW"), "Dashboard must not retain the old fake-health banner");
process.stdout.write("Control Center HTML and inline JavaScript checks passed.\\n");
