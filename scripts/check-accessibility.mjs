import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const errors = [];

const attr = (source, name) => {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(new RegExp("(?:^|\\s)" + escaped + "\\s*=\\s*([\\"'])(.*?)\\1", "i"));
  return match?.[2] ?? null;
};

if (!/<html\\b[^>]*\\blang=["']vi["']/i.test(html)) errors.push("HTML root must declare lang=vi");
if (!/<main\\b/i.test(html)) errors.push("A main landmark is required");
if (!/<nav\\b/i.test(html)) errors.push("A navigation landmark is required");

for (const match of html.matchAll(/<button\\b([^>]*)>([\\s\\S]*?)<\\/button>/gi)) {
  const attributes = match[1];
  const text = match[2].replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  if (!text && !attr(attributes, "aria-label") && !attr(attributes, "title")) {
    errors.push("Button is missing an accessible name: " + attributes.slice(0, 100));
  }
}

for (const match of html.matchAll(/<(input|select|textarea)\\b([^>]*)>/gi)) {
  const tag = match[1].toLowerCase();
  const attributes = match[2];
  if (/\\bdisabled(?:\\s|=|$)/i.test(attributes)) continue;
  const id = attr(attributes, "id");
  const hasAriaName = attr(attributes, "aria-label") || attr(attributes, "aria-labelledby");
  const hasLabel = id && new RegExp("<label\\b[^>]*\\bfor=[\\"']" + id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "[\\"']", "i").test(html);
  if (!hasAriaName && !hasLabel) errors.push(tag + " is missing an associated label: " + attributes.slice(0, 100));
}

for (const match of html.matchAll(/<img\\b([^>]*)>/gi)) {
  const alt = attr(match[1], "alt");
  if (alt === null) errors.push("Image is missing an alt attribute");
}

for (const match of html.matchAll(/<([a-z][a-z0-9-]*)\\b([^>]*)\\brole=["']dialog["'][^>]*>/gi)) {
  const attributes = match[2];
  if (attr(attributes, "aria-modal") !== "true" || !attr(attributes, "aria-labelledby")) {
    errors.push("Dialog must declare aria-modal=true and aria-labelledby");
  }
}

assert.deepEqual(errors, [], errors.join("\\n"));
process.stdout.write("Static accessibility checks passed (landmarks, button names, form labels, image alt and dialog semantics).\\n");
