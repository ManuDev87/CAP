import { loadWrongQuestions } from "@/lib/db";
import { loadExam } from "@/lib/tests";
import {
  classifyQuestionText,
  topicName,
  type CapTopicId,
} from "@/lib/questionTopics";

export interface ErrorTopicStat {
  id: CapTopicId;
  name: string;
  count: number;
  percent: number;
}

export interface ErrorTopicStatsResult {
  total: number;
  topics: ErrorTopicStat[];
}

export async function computeErrorTopicStats(
  username: string
): Promise<ErrorTopicStatsResult> {
  const refs = await loadWrongQuestions(username);
  if (refs.length === 0) return { total: 0, topics: [] };

  const byTest = new Map<string, Set<string>>();
  for (const ref of refs) {
    if (!byTest.has(ref.testId)) byTest.set(ref.testId, new Set());
    byTest.get(ref.testId)!.add(ref.questionNum);
  }

  const counts = new Map<CapTopicId, number>();
  let classified = 0;

  for (const [testId, nums] of byTest) {
    try {
      const exam = await loadExam(testId);
      for (const q of exam) {
        if (!nums.has(q.num)) continue;
        const optionsText = q.options.map((o) => o.text).join(" ");
        const topic = classifyQuestionText(q.question, optionsText);
        counts.set(topic, (counts.get(topic) ?? 0) + 1);
        classified += 1;
      }
    } catch (err) {
      console.error(`No se pudo clasificar el examen ${testId}`, err);
    }
  }

  if (classified === 0) return { total: 0, topics: [] };

  const topics = Array.from(counts.entries())
    .map(([id, count]) => ({
      id,
      name: topicName(id),
      count,
      percent: Math.round((count / classified) * 100),
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "es"));

  return { total: classified, topics };
}
