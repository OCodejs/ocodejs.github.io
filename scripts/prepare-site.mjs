import { access, cp, mkdir, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export async function prepareSite(root) {
  const output = join(root, "_site");
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });

  for (const path of ["index.html", "home", "OCODEJS", "plugin-hub.html", "plugin-hub.js", "README.md", "docs", "assets"]) {
    await cp(join(root, path), join(output, path), { recursive: true });
  }

  // Optional site enhancements should not break minimal fixtures or local builds.
  for (const path of ["infra", "CNAME", "robots.txt", "sitemap.xml", "favicon.svg"]) {
    const source = join(root, path);
    try {
      await access(source);
      await cp(source, join(output, path), { recursive: true });
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await prepareSite(fileURLToPath(new URL("../", import.meta.url)));
}
