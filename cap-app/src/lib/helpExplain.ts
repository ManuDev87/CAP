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

function firstTip(question: string, correct: string, list: Tip[]): string | null {
  const blob = blobOf(question, correct);
  for (const tip of list) {
    if (!matches(blob, tip.all, tip.any)) continue;
    if (tip.answer?.length && !tip.answer.some((r) => r.test(correct))) continue;
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
