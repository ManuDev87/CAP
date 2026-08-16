"use client";

import type { ErrorTopicStat } from "@/lib/errorTopicStats";

export default function ErrorTopicList({
  total,
  topics,
  loading,
  emptyMessage = "Cuando falles preguntas en los exámenes, aquí verás en qué temas te equivocas más.",
}: {
  total: number;
  topics: ErrorTopicStat[];
  loading: boolean;
  emptyMessage?: string;
}) {
  if (loading) {
    return (
      <p className="px-1 py-6 text-sm text-ink-400">
        Calculando estadísticas de fallos…
      </p>
    );
  }

  if (total === 0) {
    return (
      <p className="px-1 py-6 text-sm leading-relaxed text-ink-400">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div>
      <p className="mb-3 text-xs text-ink-400">
        Sobre {total} pregunta{total === 1 ? "" : "s"} fallada
        {total === 1 ? "" : "s"}
      </p>
      <ol className="error-topic-list">
        {topics.map((t) => (
          <li key={t.id} className="error-topic-row">
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 font-semibold text-ink-900">{t.name}</span>
              <span className="shrink-0 tabular-nums font-extrabold text-brand-600">
                {t.percent}%
              </span>
            </div>
            <div className="error-topic-track" aria-hidden="true">
              <div
                className="error-topic-fill"
                style={{ width: `${Math.max(t.percent, t.count > 0 ? 2 : 0)}%` }}
              />
            </div>
            <span className="text-[11px] text-ink-400">
              {t.count} fallo{t.count === 1 ? "" : "s"}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
