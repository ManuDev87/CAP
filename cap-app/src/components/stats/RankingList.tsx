"use client";

import { useMemo } from "react";
import { formatScore } from "@/lib/scoring";
import type { ScoreRecord } from "@/lib/types";
import { IconCheckCircle, IconCrossCircle } from "@/components/icons";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function RankingList({ records }: { records: ScoreRecord[] }) {
  const ranking = useMemo(() => {
    // Best score per test
    const bestByTest = new Map<
      string,
      { testName: string; score: number; passed: boolean }
    >();
    for (const r of records) {
      const existing = bestByTest.get(r.testId);
      if (!existing || r.score > existing.score) {
        bestByTest.set(r.testId, {
          testName: r.testName,
          score: r.score,
          passed: r.score >= 50,
        });
      }
    }
    return Array.from(bestByTest.entries())
      .map(([testId, item]) => ({
        testId,
        ...item,
        attempts: records.filter((r) => r.testId === testId).length,
      }))
      .sort((a, b) => b.score - a.score);
  }, [records]);

  if (records.length === 0) {
    return (
      <p className="px-5 py-10 text-center text-sm leading-loose text-ink-300">
        Aún no has completado ningún examen.
        <br />
        Finaliza un test y guarda el resultado para ver tu ranking.
      </p>
    );
  }

  return (
    <ul className="flex max-h-125 list-none flex-col gap-2.5 overflow-y-auto">
      {ranking.map((item, i) => (
        <li
          key={item.testId}
          className={`ranking-item ${item.passed ? "rank-pass" : "rank-fail"}`}
        >
          <span className="w-8.5 shrink-0 text-center text-2xl">
            {MEDALS[i] || `${i + 1}º`}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-sm font-bold text-ink-900">
              {item.testName}
            </span>
            <span className="text-xs text-ink-400">
              {item.attempts} intento{item.attempts !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {item.passed ? <IconCheckCircle /> : <IconCrossCircle />}
            <span className="text-xl font-black text-ink-900">
              {formatScore(item.score)}
              <small className="text-[11px] font-normal text-ink-400">
                /100
              </small>
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
