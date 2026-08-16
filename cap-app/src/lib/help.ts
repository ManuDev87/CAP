import helpBankJson from "@/data/help-bank.json";
import helpBankViajerosJson from "@/data/help-bank-viajeros.json";
import type { CapTrack, Question, QuestionHelp } from "./types";
import { composeStudentExplanation } from "./helpExplain";

type BankEntry = {
  explanation: string;
  source?: string;
  sourceUrl?: string | null;
  origin: "catalog" | "official-ref";
  ruleId?: string;
};

const helpBank = helpBankJson as Record<string, BankEntry>;
const helpBankViajeros = helpBankViajerosJson as Record<string, BankEntry>;

export function trackFromExamId(
  examId: string | undefined,
  fallback?: CapTrack | null
): CapTrack {
  if (examId?.startsWith("viajeros_")) return "viajeros";
  if (fallback === "viajeros") return "viajeros";
  return "mercancias";
}

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

export function getQuestionHelp(
  q: Question,
  track: CapTrack = "mercancias"
): QuestionHelp {
  const correctText = correctOptionText(q);
  const bank = track === "viajeros" ? helpBankViajeros : helpBank;
  const entry = bank[helpKey(q.question, correctText)];

  if (!entry) {
    return {
      correctText,
      origin: "temario",
      verified: false,
      explanation: composeStudentExplanation(q, track),
    };
  }

  return {
    correctText,
    explanation: entry.explanation,
    source: entry.source,
    sourceUrl: entry.sourceUrl || undefined,
    origin: entry.origin,
    verified: true,
  };
}
