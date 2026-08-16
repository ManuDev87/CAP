import helpBankJson from "@/data/help-bank.json";
import type { Question, QuestionHelp } from "./types";

type BankEntry = {
  explanation: string;
  source?: string;
  sourceUrl?: string | null;
  origin: "catalog" | "official-ref";
  ruleId?: string;
};

const helpBank = helpBankJson as Record<string, BankEntry>;

/** Must stay in sync with scripts/help_key.py */
export function normText(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[¿?¡!]/g, "")
    .replace(/\s+/g, " ")
    .replace(/^[ .;:]+|[ .;:]+$/g, "");
}

export function helpKey(question: string, correctText: string): string {
  return `${normText(question)}\t${normText(correctText)}`;
}

export function correctOptionText(q: Question): string {
  const letter = (q.correct || "").toLowerCase();
  return q.options.find((o) => o.id.toLowerCase() === letter)?.text ?? "";
}

function plantillaHelp(correctText: string): QuestionHelp {
  return {
    correctText,
    origin: "plantilla",
    verified: false,
    explanation:
      "La plantilla oficial de este examen marca como correcta la opción resaltada en verde.\n\n" +
      `«${correctText.trim()}»\n\n` +
      "No añadimos un artículo legal automático cuando no hemos podido verificarlo en el BOE, EUR-Lex o el programa oficial CAP (RD 284/2021). Así evitamos citar normativa inventada o desactualizada.",
  };
}

export function getQuestionHelp(q: Question): QuestionHelp {
  const correctText = correctOptionText(q);
  const entry = helpBank[helpKey(q.question, correctText)];
  if (!entry) return plantillaHelp(correctText);

  return {
    correctText,
    explanation: entry.explanation,
    source: entry.source,
    sourceUrl: entry.sourceUrl || undefined,
    origin: entry.origin,
    verified: true,
  };
}
