import helpBankJson from "@/data/help-bank.json";
import type { Question, QuestionHelp } from "./types";
import { composeStudentExplanation, discardedOptionsText } from "./helpExplain";

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

export function getQuestionHelp(q: Question): QuestionHelp {
  const correctText = correctOptionText(q);
  const entry = helpBank[helpKey(q.question, correctText)];
  const others = discardedOptionsText(q);

  if (!entry) {
    return {
      correctText,
      origin: "temario",
      verified: false,
      explanation: composeStudentExplanation(q),
    };
  }

  const withOthers =
    others && !entry.explanation.includes("Las otras opciones")
      ? `${entry.explanation}\n\n${others}`
      : entry.explanation;

  return {
    correctText,
    explanation: withOthers,
    source: entry.source,
    sourceUrl: entry.sourceUrl || undefined,
    origin: entry.origin,
    verified: true,
  };
}
