/**
 * Converts the legacy plain-JS exam databases (examen-web/data/*.js)
 * into typed JSON modules under src/data/exams/.
 *
 * The legacy `data.js` (Enero 2023 / "Antiguo Test 1012") is intentionally
 * skipped: it was loaded via <script> but never referenced by the app.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LEGACY_DIR = join(__dirname, "..", "..", "examen-web", "data");
const OUT_DIR = join(__dirname, "..", "src", "data", "exams");

const TEST_IDS = [
  "febrero_2023", "marzo_2023", "junio_2023", "julio_2023",
  "septiembre_2023", "noviembre_2023", "enero_2024", "marzo_2024",
  "mayo_2024", "julio_2024", "septiembre_2024", "noviembre_2024",
  "enero_2025", "marzo_2025", "mayo_2025", "julio_2025",
  "septiembre_2025", "noviembre_2025", "enero_2026", "marzo_2026",
  "mayo_2026",
];

mkdirSync(OUT_DIR, { recursive: true });

let ok = 0;
for (const id of TEST_IDS) {
  const file = join(LEGACY_DIR, `data_${id}.js`);
  const src = readFileSync(file, "utf8");
  const match = src.match(/=\s*(\[[\s\S]*\])\s*;?\s*$/);
  if (!match) throw new Error(`Could not extract array from ${file}`);

  // eslint-disable-next-line no-new-func
  const arr = new Function(`return (${match[1]});`)();
  if (!Array.isArray(arr) || arr.length < 100) {
    throw new Error(`${id}: expected >= 100 questions, got ${arr?.length}`);
  }
  for (const [i, q] of arr.entries()) {
    if (
      typeof q.question !== "string" ||
      !Array.isArray(q.options) ||
      q.options.length < 2 ||
      typeof q.correct !== "string" ||
      !q.options.some((o) => o.id === q.correct)
    ) {
      throw new Error(`${id}: invalid question at index ${i}`);
    }
  }

  // Normalize: legacy files are inconsistent (num as number in marzo_2024)
  const normalized = arr.map((q) => ({ ...q, num: String(q.num) }));

  writeFileSync(join(OUT_DIR, `${id}.json`), JSON.stringify(normalized));
  console.log(`✔ ${id}: ${arr.length} preguntas`);
  ok++;
}
console.log(`\n${ok}/${TEST_IDS.length} exámenes convertidos -> src/data/exams/`);
