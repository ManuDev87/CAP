"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useApp } from "@/context/AppContext";
import {
  createUser,
  deleteUser,
  listStudentsByTeacher,
  loadScoreRecords,
  type UserListEntry,
} from "@/lib/db";
import type { ScoreRecord } from "@/lib/types";
import { computeErrorTopicStats } from "@/lib/errorTopicStats";
import type { ErrorTopicStat } from "@/lib/errorTopicStats";
import RankingList from "@/components/stats/RankingList";
import StatsChart from "@/components/stats/StatsChart";
import ErrorTopicList from "@/components/stats/ErrorTopicList";
import {
  IconArrowLeft,
  IconChart,
  IconLogout,
  IconSpinner,
  IconTrash,
} from "@/components/icons";

export default function TeacherScreen() {
  const { user, logout } = useApp();
  const teacherId = user?.username ?? "";

  const [students, setStudents] = useState<UserListEntry[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [noPwd, setNoPwd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const [selected, setSelected] = useState<UserListEntry | null>(null);
  const [records, setRecords] = useState<ScoreRecord[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [errorTopics, setErrorTopics] = useState<ErrorTopicStat[]>([]);
  const [errorTotal, setErrorTotal] = useState(0);
  const [errorTopicsLoading, setErrorTopicsLoading] = useState(false);

  const refreshStudents = useCallback(async () => {
    if (!teacherId) return;
    setLoadError(false);
    try {
      setStudents(await listStudentsByTeacher(teacherId));
    } catch (err) {
      console.error(err);
      setLoadError(true);
    }
  }, [teacherId]);

  useEffect(() => {
    refreshStudents();
  }, [refreshStudents]);

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

  async function handleAddStudent(e: FormEvent) {
    e.preventDefault();
    if (!teacherId) return;
    const n = name.trim();
    const u = username.trim().toLowerCase();
    let p = password.trim();
    if (!n || !u) return;
    if (!noPwd && !p) return;
    if (noPwd) p = "";

    setBusy(true);
    try {
      const created = await createUser({
        username: u,
        name: n,
        password: p,
        role: "student",
        teacherId,
      });
      if (!created) {
        alert("Ese nombre de usuario ya existe.");
        return;
      }
      setName("");
      setUsername("");
      setPassword("");
      setNoPwd(false);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
      await refreshStudents();
    } catch (err) {
      alert("Error al conectar: " + (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(u: string) {
    if (!confirm(`¿Seguro que quieres borrar al alumno ${u}?`)) return;
    try {
      await deleteUser(u);
      if (selected?.username === u) setSelected(null);
      await refreshStudents();
    } catch (err) {
      alert("Error al borrar: " + (err as Error).message);
    }
  }

  async function openStudent(student: UserListEntry) {
    setSelected(student);
    setFilter("all");
    setStatsLoading(true);
    setErrorTopicsLoading(true);
    setErrorTopics([]);
    setErrorTotal(0);
    try {
      const [scoreRecords, topicStats] = await Promise.all([
        loadScoreRecords(student.username),
        computeErrorTopicStats(student.username),
      ]);
      setRecords(scoreRecords);
      setErrorTopics(topicStats.topics);
      setErrorTotal(topicStats.total);
    } catch (err) {
      console.error(err);
      setRecords([]);
      setErrorTopics([]);
      setErrorTotal(0);
      alert("No se pudieron cargar las estadísticas del alumno.");
    } finally {
      setStatsLoading(false);
      setErrorTopicsLoading(false);
    }
  }

  if (selected) {
    return (
      <div className="screen-overlay z-4000 bg-appbg px-5 py-10 max-md:px-2.5 max-md:py-4">
        <div className="panel-card mx-auto max-w-275 overflow-hidden">
          <div
            className="flex flex-wrap items-center justify-between gap-3 px-7 py-5 text-white max-md:px-4"
            style={{
              background: "linear-gradient(135deg, #0A8442 0%, #064e29 100%)",
            }}
          >
            <h2 className="flex items-center gap-2.5 text-[22px] font-bold max-md:text-lg">
              <IconChart className="text-2xl" />
              Seguimiento · {selected.name}
            </h2>
            <button
              onClick={() => setSelected(null)}
              className="btn rounded-full border-none bg-white px-4.5 py-2 text-sm font-bold text-brand-600 shadow-md hover:-translate-y-0.5 hover:bg-appbg"
            >
              <IconArrowLeft /> Volver a mis alumnos
            </button>
          </div>

          <div className="border-b border-line bg-white px-7 py-3 text-sm text-ink-600 max-md:px-4">
            Usuario: <strong className="text-ink-900">{selected.username}</strong>
          </div>

          {statsLoading ? (
            <div className="flex items-center justify-center gap-2 p-16 text-ink-600">
              <IconSpinner className="text-xl" /> Cargando estadísticas…
            </div>
          ) : (
            <div className="grid min-h-125 md:grid-cols-[320px_minmax(0,1fr)]">
              <div className="min-w-0 overflow-y-auto border-line p-7 max-md:border-b md:border-r">
                <h3 className="panel-heading text-base">
                  Ranking de Mejores Puntuaciones
                </h3>
                <RankingList records={records} />
              </div>
              <div className="min-w-0 p-7">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5">
                  <h3 className="panel-heading !mb-0 text-base">
                    Evolución de Resultados
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
                    emptyMessage="Este alumno aún no tiene preguntas falladas registradas."
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="screen-overlay z-4000 bg-appbg px-5 py-10 max-md:px-2.5 max-md:py-4">
      <div className="panel-card mx-auto max-w-275 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-navy-700 px-7 py-5 text-white max-md:px-4">
          <div>
            <h2 className="text-xl font-medium max-md:text-lg">
              Panel del Profesor
            </h2>
            <p className="mt-0.5 text-sm text-white/80">
              {user?.name}
              {user ? " · tus alumnos" : ""}
            </p>
          </div>
          <button onClick={logout} className="btn-ghost-light">
            <IconLogout className="text-base" /> Salir
          </button>
        </div>

        <div className="grid gap-7 p-7 md:grid-cols-2 max-md:p-4">
          <div className="rounded-xl border border-line bg-surface p-5">
            <h3 className="panel-heading">Añadir Nuevo Alumno</h3>
            <form onSubmit={handleAddStudent} className="flex flex-col gap-3">
              <input
                type="text"
                className="input"
                placeholder="Nombre completo"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                type="text"
                className="input"
                placeholder="Usuario login"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <input
                type="password"
                className="input"
                placeholder="Contraseña"
                required={!noPwd}
                disabled={noPwd}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <label className="mb-1 flex items-center gap-2 text-sm text-ink-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-brand-500"
                  checked={noPwd}
                  onChange={(e) => {
                    setNoPwd(e.target.checked);
                    if (e.target.checked) setPassword("");
                  }}
                />
                El alumno establecerá la contraseña al entrar
              </label>
              <button type="submit" className="btn-primary" disabled={busy}>
                {busy && <IconSpinner className="text-base" />}
                Crear Alumno
              </button>
              {successMsg && (
                <p className="success-text">Alumno creado con éxito</p>
              )}
            </form>
          </div>

          <div className="rounded-xl border border-line bg-surface p-5">
            <h3 className="panel-heading">Mis Alumnos</h3>
            <ul className="max-h-100 list-none overflow-y-auto">
              {students === null && !loadError && (
                <li className="py-3 text-sm text-ink-600">Cargando alumnos...</li>
              )}
              {loadError && (
                <li className="py-3 text-sm text-danger-500">
                  Error al cargar alumnos.
                </li>
              )}
              {students !== null && students.length === 0 && (
                <li className="py-3 text-sm text-ink-600">
                  Aún no tienes alumnos. Añade el primero.
                </li>
              )}
              {students?.map((u) => (
                <li
                  key={u.username}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-line py-3 last:border-b-0"
                >
                  <div className="flex min-w-0 flex-1 flex-col px-1">
                    <span className="truncate font-bold text-ink-900">
                      {u.name}
                    </span>
                    <span className="text-[13px] text-ink-400">
                      Usuario: {u.username}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      className="btn-ghost-brand !px-3 !py-1.5 !text-[13px]"
                      onClick={() => openStudent(u)}
                      title="Ver seguimiento"
                    >
                      <IconChart className="text-sm" /> Ver estadísticas
                    </button>
                    <button
                      className="btn-danger-soft"
                      onClick={() => handleDelete(u.username)}
                    >
                      Eliminar <IconTrash className="text-sm" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
