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
import type { CapTrack, ScoreRecord } from "@/lib/types";
import { CAP_TRACK_LABELS } from "@/lib/types";
import { computeErrorTopicStats } from "@/lib/errorTopicStats";
import type { ErrorTopicStat } from "@/lib/errorTopicStats";
import RankingList from "@/components/stats/RankingList";
import StatsChart from "@/components/stats/StatsChart";
import ErrorTopicList from "@/components/stats/ErrorTopicList";
import StaffShell from "@/components/staff/StaffShell";
import {
  IconArrowLeft,
  IconChart,
  IconSpinner,
  IconTrash,
  IconUserPlus,
  IconUsers,
} from "@/components/icons";

type TeacherSection = "alumnos" | "alta" | "seguimiento";

export default function TeacherScreen() {
  const { user, logout } = useApp();
  const teacherId = user?.username ?? "";
  const [section, setSection] = useState<TeacherSection>("alumnos");

  const [students, setStudents] = useState<UserListEntry[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [noPwd, setNoPwd] = useState(false);
  const [capTrack, setCapTrack] = useState<CapTrack>("mercancias");
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

  const counts = useMemo(() => {
    const total = students?.length ?? 0;
    const mercancias =
      students?.filter((u) => u.capTrack === "mercancias").length ?? 0;
    const viajeros =
      students?.filter((u) => u.capTrack === "viajeros").length ?? 0;
    return { total, mercancias, viajeros };
  }, [students]);

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
        capTrack,
      });
      if (!created) {
        alert("Ese nombre de usuario ya existe.");
        return;
      }
      setName("");
      setUsername("");
      setPassword("");
      setNoPwd(false);
      setCapTrack("mercancias");
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
      await refreshStudents();
      setSection("alumnos");
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
      if (selected?.username === u) {
        setSelected(null);
        setSection("alumnos");
      }
      await refreshStudents();
    } catch (err) {
      alert("Error al borrar: " + (err as Error).message);
    }
  }

  async function openStudent(student: UserListEntry) {
    setSelected(student);
    setSection("seguimiento");
    setFilter("all");
    setStatsLoading(true);
    setErrorTopicsLoading(true);
    setErrorTopics([]);
    setErrorTotal(0);
    try {
      const [scoreRecords, topicStats] = await Promise.all([
        loadScoreRecords(student.username),
        computeErrorTopicStats(student.username, student.capTrack),
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

  function backToStudents() {
    setSelected(null);
    setSection("alumnos");
  }

  const navItems = [
    { id: "alumnos", label: "Mis alumnos", icon: <IconUsers /> },
    { id: "alta", label: "Alta alumno", icon: <IconUserPlus /> },
    ...(selected
      ? [{ id: "seguimiento", label: "Seguimiento", icon: <IconChart /> }]
      : []),
  ];

  const heading =
    section === "alta"
      ? { title: "Alta de alumno", subtitle: "Crea un acceso para tu autoescuela" }
      : section === "seguimiento" && selected
        ? {
            title: `Seguimiento · ${selected.name}`,
            subtitle: `Usuario ${selected.username} · ${CAP_TRACK_LABELS[selected.capTrack]}`,
          }
        : {
            title: "Mis alumnos",
            subtitle: user?.name ? `${user.name} · tu grupo` : "Tu grupo",
          };

  return (
    <StaffShell
      brand="Grupo CAP"
      eyebrow="Portal profesor"
      userName={user?.name}
      items={navItems}
      activeId={section}
      onSelect={(id) => {
        const next = id as TeacherSection;
        if (next !== "seguimiento") setSelected(null);
        setSection(next);
      }}
      onLogout={logout}
      title={heading.title}
      subtitle={heading.subtitle}
      headerAction={
        section === "seguimiento" ? (
          <button
            type="button"
            className="btn-ghost-brand !px-3.5 !py-2 !text-sm"
            onClick={backToStudents}
          >
            <IconArrowLeft /> Volver
          </button>
        ) : null
      }
    >
      {section === "alumnos" && (
        <>
          <div className="mb-6 grid gap-5 sm:grid-cols-3">
            <article className="staff-stat is-accent">
              <p className="staff-stat-label">Alumnos</p>
              <p className="staff-stat-value">
                {students === null ? "—" : counts.total}
              </p>
            </article>
            <article className="staff-stat">
              <p className="staff-stat-label">Mercancías</p>
              <p className="staff-stat-value">
                {students === null ? "—" : counts.mercancias}
              </p>
            </article>
            <article className="staff-stat">
              <p className="staff-stat-label">Viajeros</p>
              <p className="staff-stat-value">
                {students === null ? "—" : counts.viajeros}
              </p>
            </article>
          </div>
          <div className="staff-card">
            <h3 className="panel-heading">Listado</h3>
            <ul className="staff-list">
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
                  Aún no tienes alumnos. Usa Alta alumno para crear el primero.
                </li>
              )}
              {students?.map((u) => (
                <li key={u.username} className="staff-list-item flex-wrap">
                  <div className="flex min-w-0 flex-1 flex-col px-1">
                    <span className="truncate font-bold text-ink-900">
                      {u.name}
                    </span>
                    <span className="text-[13px] text-ink-400">
                      Usuario: {u.username} · {CAP_TRACK_LABELS[u.capTrack]}
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
        </>
      )}

      {section === "alta" && (
        <div className="mx-auto max-w-xl">
          <div className="staff-card">
            <h3 className="panel-heading">Nuevo alumno</h3>
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
              <fieldset className="mb-1">
                <legend className="mb-2 text-sm font-semibold text-ink-600">
                  Modalidad CAP
                </legend>
                <div className="flex gap-2">
                  {(["mercancias", "viajeros"] as const).map((track) => (
                    <label
                      key={track}
                      className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold transition-colors ${
                        capTrack === track
                          ? "border-brand-500 bg-brand-50 text-brand-700"
                          : "border-line bg-white text-ink-600"
                      }`}
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        name="capTrack"
                        checked={capTrack === track}
                        onChange={() => setCapTrack(track)}
                      />
                      {CAP_TRACK_LABELS[track]}
                    </label>
                  ))}
                </div>
              </fieldset>
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
                Crear alumno
              </button>
              {successMsg && (
                <p className="success-text">Alumno creado con éxito</p>
              )}
            </form>
          </div>
        </div>
      )}

      {section === "seguimiento" && selected && (
        <div className="staff-card overflow-hidden p-0">
          {statsLoading ? (
            <div className="flex items-center justify-center gap-2 p-16 text-ink-600">
              <IconSpinner className="text-xl" /> Cargando estadísticas…
            </div>
          ) : (
            <div className="grid min-h-125 md:grid-cols-[320px_minmax(0,1fr)]">
              <div className="min-w-0 overflow-y-auto border-line p-7 max-md:border-b md:border-r">
                <h3 className="panel-heading text-base">
                  Ranking de mejores puntuaciones
                </h3>
                <RankingList records={records} />
              </div>
              <div className="min-w-0 p-7">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5">
                  <h3 className="panel-heading !mb-0 text-base">
                    Evolución de resultados
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
      )}
    </StaffShell>
  );
}
