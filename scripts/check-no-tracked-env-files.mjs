import { execFileSync } from "node:child_process";

const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean);

const forbidden = tracked.filter((path) => {
  const base = path.split("/").at(-1);
  if (base === ".env.example") return false;
  return /^\.env(?:$|\.)/.test(base) || /^\.dev\.vars(?:$|\.)/.test(base);
});

if (forbidden.length) {
  console.error("Blocked: tracked local environment/secret files:");
  for (const path of forbidden) console.error(" - " + path);
  process.exit(1);
}

console.log("Secret-file tracking check passed.");
