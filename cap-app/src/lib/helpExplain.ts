import type { CapTrack, Question } from "./types";
import tipsPack from "@/data/help-tips.json";
import tipsViajerosPack from "@/data/help-tips-viajeros.json";

function correctOptionText(q: Question): string {
  const letter = (q.correct || "").toLowerCase();
  return q.options.find((o) => o.id.toLowerCase() === letter)?.text ?? "";
}

type RawTip = {
  all?: string[];
  any?: string[];
  answer?: string[];
  text: string;
};

type Tip = {
  all?: RegExp[];
  any?: RegExp[];
  answer?: RegExp[];
  text: string;
};

function compileTip(raw: RawTip): Tip {
  return {
    all: raw.all?.map((p) => new RegExp(p, "i")),
    any: raw.any?.map((p) => new RegExp(p, "i")),
    answer: raw.answer?.map((p) => new RegExp(p, "i")),
    text: raw.text,
  };
}

const TIPS: Tip[] = (tipsPack.tips as RawTip[]).map(compileTip);
const GLOSSARY: Tip[] = (tipsPack.glossary as RawTip[]).map(compileTip);
const TIPS_VIAJEROS: Tip[] = (tipsViajerosPack.tips as RawTip[]).map(compileTip);
const GLOSSARY_VIAJEROS: Tip[] = (tipsViajerosPack.glossary as RawTip[]).map(
  compileTip
);

function blobOf(question: string, correct: string): string {
  return `${question}\n${correct}`;
}

function matches(text: string, all?: RegExp[], any?: RegExp[]): boolean {
  if (all?.length && !all.every((r) => r.test(text))) return false;
  if (any?.length && !any.some((r) => r.test(text))) return false;
  return Boolean(all?.length || any?.length);
}

const TIP_STOP = new Set([
  "para",
  "como",
  "esta",
  "este",
  "esto",
  "esos",
  "esas",
  "todo",
  "toda",
  "todos",
  "todas",
  "sobre",
  "entre",
  "desde",
  "hasta",
  "cuando",
  "donde",
  "cual",
  "cuales",
  "quien",
  "porque",
  "segun",
  "hacia",
  "ante",
  "bajo",
  "durante",
  "mediante",
  "contra",
  "respuesta",
  "respuestas",
  "correcta",
  "correctas",
  "incorrecta",
  "afirmacion",
  "siguiente",
  "siguientes",
  "anterior",
  "anteriores",
  "debe",
  "deben",
  "puede",
  "pueden",
  "sera",
  "seran",
  "tiene",
  "tienen",
  "hace",
  "caso",
  "forma",
  "parte",
  "tipo",
  "tipos",
  "tambien",
  "ademas",
  "mismo",
  "misma",
  "otros",
  "otras",
  "solo",
  "ningun",
  "ninguna",
  "cualquier",
  "cualquiera",
  "siempre",
  "nunca",
  "articulo",
  "normativa",
  "temario",
  "oficial",
  "examen",
  "opcion",
  "enunciado",
  "pregunta",
  "conductor",
  "conductores",
  "vehiculo",
  "vehiculos",
  "transporte",
  "empresa",
  "empresas",
]);

function foldHelp(s: string): string {
  return (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ");
}

function tipTokens(s: string): Set<string> {
  const out = new Set<string>();
  for (const w of foldHelp(s).split(" ").filter(Boolean)) {
    if (w.length < 4 || TIP_STOP.has(w) || /^\d+$/.test(w)) continue;
    out.add(w);
  }
  return out;
}

function tipHits(src: Set<string>, dst: Set<string>): number {
  let n = 0;
  for (const x of src) {
    for (const y of dst) {
      if (x === y || (x.length >= 5 && y.length >= 5 && (x.includes(y) || y.includes(x)))) {
        n += 1;
        break;
      }
    }
  }
  return n;
}

/** Skip a generic tip if it explains a different concept than the item. */
function explanationMatchesItem(expl: string, question: string, answer: string): boolean {
  const te = tipTokens(expl);
  const tq = tipTokens(question);
  const ta = tipTokens(answer);
  const tqa = new Set([...tq, ...ta]);
  const hE = tipHits(te, tqa);
  const hA = ta.size ? tipHits(ta, te) : 0;
  if (hE >= 3 || hA >= 2 || (hE >= 2 && hA >= 1)) return true;
  const numsA = new Set(foldHelp(answer).match(/\d+(?:[.,]\d+)?/g) ?? []);
  const numsE = new Set(foldHelp(expl).match(/\d+(?:[.,]\d+)?/g) ?? []);
  if (numsA.size && [...numsA].some((n) => numsE.has(n)) && hE >= 1) return true;
  return false;
}

function firstTip(question: string, correct: string, list: Tip[]): string | null {
  const blob = blobOf(question, correct);
  for (const tip of list) {
    if (!matches(blob, tip.all, tip.any)) continue;
    if (tip.answer?.length && !tip.answer.some((r) => r.test(correct))) continue;
    if (!tip.answer?.length && !explanationMatchesItem(tip.text, question, correct)) {
      continue;
    }
    return tip.text;
  }
  return null;
}

export function knowledgeTip(
  question: string,
  correct: string,
  track: CapTrack = "mercancias"
): string | null {
  if (track === "viajeros") {
    return (
      firstTip(question, correct, TIPS_VIAJEROS) ||
      firstTip(question, correct, GLOSSARY_VIAJEROS)
    );
  }
  return firstTip(question, correct, TIPS) || firstTip(question, correct, GLOSSARY);
}

function isFalseQuestion(question: string): boolean {
  return /incorrecta|no es correcta|falsa|no es acorde|equivocada|inadecuada/i.test(
    question
  );
}

function cleanAnswer(correct: string): string {
  return correct.trim().replace(/\.$/, "");
}

function stripQuestionMarks(question: string): string {
  return question.replace(/[¿?]/g, "").replace(/\s+/g, " ").trim();
}

function uncapitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}

/**
 * Último recurso: convierte enunciado + opción en una frase del temario.
 * Nunca dice «es correcta porque encaja con el test».
 */
function explainFromStem(question: string, correct: string): string {
  const c = cleanAnswer(correct);
  const q = stripQuestionMarks(question);

  if (
    /todas las respuestas/i.test(correct) &&
    /correctas/i.test(correct) &&
    !/incorrectas/i.test(correct)
  ) {
    return `En este ítem el temario da por válidas a la vez las opciones del enunciado: no hay que quedarse solo con una.`;
  }
  if (
    /ninguna de las respuestas/i.test(correct) ||
    /todas las respuestas anteriores son incorrectas/i.test(correct)
  ) {
    return `Ninguna de las otras afirmaciones se sostiene con el temario: hay que marcar que no vale ninguna.`;
  }
  if (isFalseQuestion(question)) {
    return `El enunciado pide lo que no se sostiene. «${c}» es la afirmación que el temario trata como incorrecta.`;
  }

  const named =
    /^(c[oó]mo se denomin[ae]|c[oó]mo se llama|qu[eé] nombre recibe)\s+(.+)/i.exec(
      q
    );
  if (named) {
    const defn = named[2].replace(/[:.]+$/, "").trim();
    return `Se llama «${c}» a ${defn}.`;
  }

  if (/^s[ií]\b/i.test(c)) {
    if (c.length > 5) return `${c.charAt(0).toUpperCase()}${c.slice(1)}.`;
    return `Sí: ${uncapitalize(q)}.`;
  }
  if (/^no\b/i.test(c)) {
    if (c.length > 5) return `${c.charAt(0).toUpperCase()}${c.slice(1)}.`;
    return `No: ${uncapitalize(q)}.`;
  }

  if (/:\s*$/.test(q)) {
    const head = q.replace(/:\s*$/, "").trim();
    const sentence = `${head} ${c}.`;
    return sentence.charAt(0).toUpperCase() + sentence.slice(1);
  }

  if (/^(qu[eé] es|qu[eé] significa|a qu[eé] se denomina)\s+/i.test(q)) {
    return `${q} ${c}.`.replace(/\s+/g, " ");
  }

  return `${c}: ${uncapitalize(q)}.`;
}

/** Explicación para el alumno cuando no hay ficha del catálogo normativo. */
export function composeStudentExplanation(
  q: Question,
  track: CapTrack = "mercancias"
): string {
  const correct = correctOptionText(q);
  return (
    knowledgeTip(q.question, correct, track) ||
    explainFromStem(q.question, correct)
  );
}
