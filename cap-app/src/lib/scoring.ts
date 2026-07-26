import type { AnswerMap, Question, ScoreBreakdown } from "./types";

/**
 * Official CAP scoring system (unchanged from the legacy app):
 * only the first 100 questions count.
 * Correct: +1 | Incorrect: -0.5 | Unanswered: 0
 * Questions 101-103 are reserve questions (informational bonus only).
 */
const SCORED_QUESTIONS = 100;
export const PASS_THRESHOLD = 50;

export function calculateScore(
  questions: Question[],
  userAnswers: AnswerMap
): ScoreBreakdown {
  let correct = 0;
  let wrong = 0;
  let blank = 0;
  let bonusCorrect = 0;

  questions.forEach((q, index) => {
    const answered = userAnswers[index];
    const isCorrect = answered === q.correct;

    if (index < SCORED_QUESTIONS) {
      if (!answered) blank++;
      else if (isCorrect) correct++;
      else wrong++;
    } else if (isCorrect) {
      bonusCorrect++;
    }
  });

  const finalScore = correct - wrong * 0.5;
  return { correct, wrong, blank, bonusCorrect, finalScore };
}

export function formatScore(score: number): string {
  return score % 1 === 0 ? String(score) : score.toFixed(1);
}
