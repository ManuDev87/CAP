"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  clearTestData,
  countWrongQuestions,
  getShowSeedBtn,
  loadScoreRecords,
  seedTestData,
} from "@/lib/db";
import type { ScoreRecord } from "@/lib/types";
import RankingList from "@/components/stats/RankingList";
import StatsChart from "@/components/stats/StatsChart";
import {
  IconArrowLeft,
  IconChart,
  IconFlask,
  IconSpinner,
  IconTrash,
  IconWarning,
} from "@/components/icons";

export default function StatsScreen() {
  const { user, goToTestSelection, startErrorTest } = useApp();

  const [records, setRecords] = useState<ScoreRecord[]>([]);
  const [canSeeSeed, setCanSeeSeed] = useState(false);
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [startingErrors, setStartingErrors] = useState(false);

  const username = user && user.role === "student" ? user.username : null;

  const reload = useCallback(async () => {
    if (!username) return;
    try {
      const [scoreRecords, wrongCount] = await Promise.all([
        loadScoreRecords(username),
        countWrongQuestions(username),
      ]);
      setRecords(scoreRecords);
      setErrorCount(wrongCount);
    } catch (err) {
      console.error("Error cargando registros de puntuación", err);
    }
  }, [username]);

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

  async function handleErrorTest() {
    if (errorCount === 0 || startingErrors) return;
    setStartingErrors(true);
    try {
      const n = await startErrorTest();
      if (n === 0) {
        alert(
          "No hay preguntas de error disponibles. Completa algún examen y falla alguna pregunta para ir acumulándolas."
        );
        await reload();
      }
    } catch (err) {
      console.error(err);
      alert("No se pudo iniciar el test de errores.");
    } finally {
      setStartingErrors(false);
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
              className="btn rounded-2xl border-none bg-white px-4.5 py-2 text-sm font-bold text-brand-600 shadow-md hover:-translate-y-0.5 hover:bg-appbg"
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

            <div className="mt-5 flex flex-col items-stretch gap-2 sm:items-start">
              <button
                type="button"
                className="errors-test-btn"
                disabled={errorCount === 0 || startingErrors}
                onClick={handleErrorTest}
                title={
                  errorCount === 0
                    ? "Aún no hay preguntas falladas guardadas"
                    : `Practicar ${errorCount} pregunta${errorCount === 1 ? "" : "s"} fallada${errorCount === 1 ? "" : "s"}`
                }
              >
                {startingErrors ? (
                  <IconSpinner className="text-base" />
                ) : (
                  <IconWarning className="text-lg" />
                )}
                <span>Test de errores</span>
                <span className="errors-test-count">
                  {errorCount}
                </span>
              </button>
              <p className="text-xs text-ink-400">
                Acumula las preguntas que falles en los exámenes. Al pulsar,
                eliges modo Examen o Ayuda solo con esos fallos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
