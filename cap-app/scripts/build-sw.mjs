/**
 * Post-build step: scans the static export (out/) and generates out/sw.js
 * with a content-hashed precache manifest. Run after `next build`.
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "out");
const TEMPLATE = join(__dirname, "sw-template.js");

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

const allFiles = walk(OUT_DIR)
  .map((f) => relative(OUT_DIR, f).replaceAll("\\", "/"))
  .filter((f) => f !== "sw.js")
  .sort();

// Build version = hash of file list + sizes (changes whenever content changes)
const hash = createHash("sha256");
for (const f of allFiles) {
  hash.update(f);
  hash.update(String(statSync(join(OUT_DIR, f)).size));
}
const version = hash.digest("hex").slice(0, 12);

const precacheList = allFiles.map((f) => `/${f}`);
const template = readFileSync(TEMPLATE, "utf8");
const sw = template
  .replace("__BUILD_VERSION__", version)
  .replace("__PRECACHE_LIST__", JSON.stringify(precacheList, null, 2));

writeFileSync(join(OUT_DIR, "sw.js"), sw);

const totalBytes = allFiles.reduce(
  (acc, f) => acc + statSync(join(OUT_DIR, f)).size,
  0
);
console.log(
  `✔ sw.js generado: ${allFiles.length} archivos precacheados (${(totalBytes / 1024 / 1024).toFixed(2)} MB), versión ${version}`
);
