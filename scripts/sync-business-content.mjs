import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const sourceRepo = "https://github.com/OCodejs/OCODEJS.git";
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ocodejs-business-"));
const checkout = path.join(tempRoot, "source");
const outputRoot = path.resolve("business-sync");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function walkMarkdown(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return walkMarkdown(full);
    return entry.isFile() && entry.name.toLowerCase().endsWith(".md") ? [full] : [];
  });
}

function parseArticle(file, root) {
  const markdown = fs.readFileSync(file, "utf8");
  const relativePath = path.relative(root, file).split(path.sep).join("/");
  const slug = path.basename(file, path.extname(file)).toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  const frontmatter = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  const fields = {};
  for (const line of (frontmatter?.[1] ?? "").split("\n")) {
    const match = line.match(/^([A-Za-z][\w-]*):\s*(.*?)\s*$/);
    if (match) fields[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
  const body = markdown.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, "").trim();
  const excerpt = (fields.description || body.replace(/^#+\s+.*$/gm, "").replace(/\s+/g, " ").slice(0, 220)).trim();
  return {
    id: slug,
    title: fields.title || slug.replace(/-/g, " "),
    description: excerpt,
    language: fields.lang || "en",
    sourcePath: relativePath,
    sourceUrl: `https://github.com/OCodejs/OCODEJS/blob/main/${relativePath}`,
    contentPath: `articles/${slug}.md`,
    markdown
  };
}

try {
  const sourceRef = process.env.OCODEJS_SOURCE_REF || "main";
  execFileSync("git", ["clone", "--depth", "1", "--branch", sourceRef, sourceRepo, checkout], { stdio: "inherit" });
  const manifestPath = path.join(checkout, "business/manifest.json");
  if (!fs.existsSync(manifestPath)) throw new Error("Source manifest missing: business/manifest.json");
  const sourceManifest = readJson(manifestPath);
  if (sourceManifest.schemaVersion !== "1.0.0") throw new Error("Unsupported business manifest schemaVersion");
  if (sourceManifest.organization?.repository !== "OCodejs/OCODEJS") throw new Error("Unexpected source repository identity");
  if (!Array.isArray(sourceManifest.projects)) throw new Error("projects must be an array");

  const ids = new Set();
  for (const project of sourceManifest.projects) {
    if (!/^[a-z0-9][a-z0-9-]{1,63}$/.test(project.id || "")) throw new Error(`Invalid project id: ${project.id}`);
    if (ids.has(project.id)) throw new Error(`Duplicate project id: ${project.id}`);
    ids.add(project.id);
    if (!project.name || !project.description || !/^https:\/\/github\.com\//.test(project.repository || "")) {
      throw new Error(`Incomplete project record: ${project.id}`);
    }
  }

  const articles = walkMarkdown(path.join(checkout, "_articles"))
    .filter((file) => !file.endsWith("/README.md"))
    .map((file) => parseArticle(file, checkout))
    .sort((a, b) => a.id.localeCompare(b.id));
  const articleIds = new Set();
  for (const article of articles) {
    if (articleIds.has(article.id)) throw new Error(`Duplicate article slug: ${article.id}`);
    articleIds.add(article.id);
  }

  const sourceCommit = execFileSync("git", ["-C", checkout, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  fs.rmSync(outputRoot, { recursive: true, force: true });
  fs.mkdirSync(path.join(outputRoot, "articles"), { recursive: true });
  const publicArticles = articles.map(({ markdown, ...metadata }) => {
    fs.writeFileSync(path.join(outputRoot, metadata.contentPath), markdown.endsWith("\n") ? markdown : markdown + "\n");
    return metadata;
  });
  const output = {
    schemaVersion: "1.0.0",
    sourceRepository: "OCodejs/OCODEJS",
    sourceCommit,
    organization: sourceManifest.organization,
    projects: sourceManifest.projects,
    articles: publicArticles,
    syncPolicy: "Generated from public source; reviewed by Draft PR; no secrets or private data."
  };
  fs.writeFileSync(path.join(outputRoot, "manifest.json"), JSON.stringify(output, null, 2) + "\n");
  console.log(`Imported ${sourceManifest.projects.length} projects and ${articles.length} articles from ${sourceCommit}`);
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
