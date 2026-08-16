"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  clearTestData,
  getShowSeedBtn,
  loadScoreRecords,
  seedTestData,
} from "@/lib/db";
import { computeErrorTopicStats } from "@/lib/errorTopicStats";
import type { ErrorTopicStat } from "@/lib/errorTopicStats";
import { normalizeCapTrack, type ScoreRecord } from "@/lib/types";
import RankingList from "@/components/stats/RankingList";
import StatsChart from "@/components/stats/StatsChart";
import ErrorTopicList from "@/components/stats/ErrorTopicList";
import {
  IconArrowLeft,
  IconChart,
  IconFlask,
  IconSpinner,
  IconTrash,
} from "@/components/icons";

export default function StatsScreen() {
  const { user, goToTestSelection, selectedTrack } = useApp();

  const [records, setRecords] = useState<ScoreRecord[]>([]);
  const [canSeeSeed, setCanSeeSeed] = useState(false);
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(false);
  const [errorTopics, setErrorTopics] = useState<ErrorTopicStat[]>([]);
  const [errorTotal, setErrorTotal] = useState(0);
  const [errorTopicsLoading, setErrorTopicsLoading] = useState(true);

  const username = user && user.role === "student" ? user.username : null;
  const statsTrack = selectedTrack ?? normalizeCapTrack(user?.capTrack);

  const reload = useCallback(async () => {
    if (!username) return;
    try {
      const [scoreRecords, topicStats] = await Promise.all([
        loadScoreRecords(username),
        computeErrorTopicStats(username, statsTrack),
      ]);
      setRecords(scoreRecords);
      setErrorTopics(topicStats.topics);
      setErrorTotal(topicStats.total);
    } catch (err) {
      console.error("Error cargando registros de puntuación", err);
    } finally {
      setErrorTopicsLoading(false);
    }
  }, [username, statsTrack]);

  useEffect(() => {
    if (!username) return;
    getShowSeedBtn(username).then(setCanSeeSeed);
    reload();
  }, [username, reload]);

  // Test filter options: first appearance order
  const filterOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: { id: string; name: string }[] = [];
    for (const r of records) {
      if (!seen.has(r.testId)) {
        seen.add(r.testId);
        options.push({ id: r.testId, name: r.testName });
      }
    }
    return options;
  }, [records]);

  async function handleSeed() {
    if (!username) return;
    setBusy(true);
    try {
      await seedTestData(username);
      await reload();
    } catch (err) {
      alert("Error: " + (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleClear() {
    if (!username) return;
    if (!confirm("¿Seguro que quieres borrar los datos?")) return;
    setBusy(true);
    try {
      await clearTestData(username);
      await reload();
    } catch (err) {
      alert("Error: " + (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="screen-overlay z-4500 bg-appbg px-5 py-10 max-md:px-2.5 max-md:py-4">
      <div className="panel-card mx-auto max-w-275 overflow-hidden">
        {/* Header */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 px-7 py-5 text-white max-md:px-4"
          style={{
            background: "linear-gradient(135deg, #0A8442 0%, #006633 100%)",
          }}
        >
          <h2 className="flex items-center gap-2.5 text-[22px] font-bold max-md:text-lg">
            <IconChart className="text-2xl" />
            Mis Estadísticas
          </h2>
          <div className="flex items-center gap-2.5">
            {canSeeSeed && (
              <button
                onClick={handleSeed}
                disabled={busy}
                title="Insertar datos de prueba en Firebase"
                className="btn-ghost-light border-white/30 bg-white/15 text-xs"
              >
                {busy ? <IconSpinner /> : <IconFlask />} Datos de prueba
              </button>
            )}
            {canSeeSeed && (
              <button
                onClick={handleClear}
                disabled={busy}
                title="Borrar datos de prueba"
                className="btn-ghost-light border-white/30 bg-red-400/25 text-xs"
              >
                <IconTrash /> Borrar datos
              </button>
            )}
            <button
              onClick={goToTestSelection}
              className="btn rounded-full border-none bg-white px-4.5 py-2 text-sm font-bold text-brand-600 shadow-md hover:-translate-y-0.5 hover:bg-appbg"
            >
              <IconArrowLeft /> Volver
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="grid min-h-125 md:grid-cols-[320px_minmax(0,1fr)]">
          {/* Ranking */}
          <div className="min-w-0 overflow-y-auto border-line p-7 max-md:border-b md:border-r">
            <h3 className="panel-heading text-base">
              🏆 Ranking de Mejores Puntuaciones
            </h3>
            <RankingList records={records} />
          </div>

          {/* Chart */}
          <div className="min-w-0 p-7">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5">
              <h3 className="panel-heading !mb-0 text-base">
                📈 Evolución de Resultados
              </h3>
              <select
                className="chart-select"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">Todos los exámenes</option>
                {filterOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
            <StatsChart records={records} filterTestId={filter} />

            <div className="mt-8">
              <h3 className="panel-heading text-base">
                Estadísticas de fallos
              </h3>
              <ErrorTopicList
                total={errorTotal}
                topics={errorTopics}
                loading={errorTopicsLoading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
