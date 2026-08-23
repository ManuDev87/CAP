"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useApp } from "@/context/AppContext";
import {
  assignStudentToTeacher,
  createUser,
  deleteUser,
  listAllStudents,
  listTeachers,
  setShowSeedBtn,
  type UserListEntry,
} from "@/lib/db";
import {
  IconLayoutDashboard,
  IconSpinner,
  IconTeacher,
  IconTrash,
  IconUsers,
} from "@/components/icons";
import StaffShell, {
  StaffSearch,
  matchesStaffQuery,
} from "@/components/staff/StaffShell";
import type { CapTrack } from "@/lib/types";
import { CAP_TRACK_LABELS } from "@/lib/types";
import {
  TRIAL_MONTH_OPTIONS,
  addTrialMonths,
  formatTrialLabel,
  remainingTrialDays,
  trialTone,
} from "@/lib/trial";

type AdminSection = "resumen" | "profesores" | "alumnos";

const NEW_SCHOOL = "__new__";

function schoolTrialEndsAt(
  teachers: UserListEntry[] | null,
  school: string
): number | undefined {
  const dates = (teachers ?? [])
    .filter((t) => t.schoolName?.trim() === school && t.trialEndsAt)
    .map((t) => t.trialEndsAt as number);
  if (!dates.length) return undefined;
  return Math.min(...dates);
}

function TrialBadge({ endsAt }: { endsAt?: number }) {
  if (!endsAt) {
    return <span className="staff-trial">Sin periodo</span>;
  }
  const days = remainingTrialDays(endsAt);
  return (
    <span className={`staff-trial ${trialTone(days)}`}>
      {formatTrialLabel(days)}
    </span>
  );
}

export default function BackofficeScreen() {
  const { logout, user } = useApp();
  const [section, setSection] = useState<AdminSection>("resumen");

  const [teachers, setTeachers] = useState<UserListEntry[] | null>(null);
  const [students, setStudents] = useState<UserListEntry[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  const [tName, setTName] = useState("");
  const [tUsername, setTUsername] = useState("");
  const [tPassword, setTPassword] = useState("");
  const [tSchool, setTSchool] = useState("");
  const [tSchoolChoice, setTSchoolChoice] = useState("");
  const [tTrialMonths, setTTrialMonths] = useState<number>(2);
  const [tBusy, setTBusy] = useState(false);
  const [tSuccess, setTSuccess] = useState(false);

  const [query, setQuery] = useState("");

  const [sName, setSName] = useState("");
  const [sUsername, setSUsername] = useState("");
  const [sPassword, setSPassword] = useState("");
  const [sNoPwd, setSNoPwd] = useState(false);
  const [sTeacherId, setSTeacherId] = useState("");
  const [sCapTrack, setSCapTrack] = useState<CapTrack>("mercancias");
  const [sBusy, setSBusy] = useState(false);
  const [sSuccess, setSSuccess] = useState(false);

  const refresh = useCallback(async () => {
    setLoadError(false);
    try {
      const [t, s] = await Promise.all([listTeachers(), listAllStudents()]);
      setTeachers(t);
      setStudents(s);
      setSTeacherId((prev) => prev || (t[0]?.username ?? ""));
    } catch (err) {
      console.error(err);
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = useMemo(() => {
    const t = teachers?.length ?? 0;
    const s = students?.length ?? 0;
    const mercancias =
      students?.filter((u) => u.capTrack === "mercancias").length ?? 0;
    const viajeros =
      students?.filter((u) => u.capTrack === "viajeros").length ?? 0;
    return { t, s, mercancias, viajeros };
  }, [teachers, students]);

  const schoolNames = useMemo(() => {
    const names = new Set<string>();
    for (const t of teachers ?? []) {
      const name = t.schoolName?.trim();
      if (name) names.add(name);
    }
    return [...names].sort((a, b) => a.localeCompare(b, "es"));
  }, [teachers]);

  const creatingNewSchool =
    schoolNames.length === 0 || tSchoolChoice === NEW_SCHOOL;

  const filteredTeachers = useMemo(() => {
    if (!teachers) return null;
    return teachers.filter((t) =>
      matchesStaffQuery(query, t.name, t.username, t.schoolName)
    );
  }, [teachers, query]);

  const filteredStudents = useMemo(() => {
    if (!students) return null;
    return students.filter((u) => {
      const teacher = teachers?.find((t) => t.username === u.teacherId);
      return matchesStaffQuery(
        query,
        u.name,
        u.username,
        CAP_TRACK_LABELS[u.capTrack],
        teacher?.name,
        teacher?.schoolName
      );
    });
  }, [students, teachers, query]);

  const filteredSchools = useMemo(() => {
    return schoolNames.filter((school) => {
      if (matchesStaffQuery(query, school)) return true;
      return (teachers ?? []).some(
        (t) =>
          t.schoolName?.trim() === school &&
          matchesStaffQuery(query, t.name, t.username)
      );
    });
  }, [schoolNames, teachers, query]);

  function teacherLabel(username?: string): string {
    if (!username) return "Sin profesor";
    const t = teachers?.find((x) => x.username === username);
    if (!t) return username;
    return t.schoolName ? `${t.schoolName} (${t.name})` : t.name;
  }

  async function handleAddTeacher(e: FormEvent) {
    e.preventDefault();
    const name = tName.trim();
    const username = tUsername.trim().toLowerCase();
    const password = tPassword.trim();
    const schoolName = creatingNewSchool
      ? tSchool.trim()
      : tSchoolChoice.trim();
    if (!name || !username || !password || !schoolName) return;

    setTBusy(true);
    try {
      const created = await createUser({
        username,
        name,
        password,
        role: "teacher",
        schoolName,
        trialEndsAt: creatingNewSchool
          ? addTrialMonths(new Date(), tTrialMonths).getTime()
          : schoolTrialEndsAt(teachers, schoolName),
      });
      if (!created) {
        alert("Ese nombre de usuario ya existe.");
        return;
      }
      setTName("");
      setTUsername("");
      setTPassword("");
      setTSchool("");
      setTSchoolChoice("");
      setTTrialMonths(2);
      setTSuccess(true);
      setTimeout(() => setTSuccess(false), 3000);
      await refresh();
    } catch (err) {
      alert("Error al conectar: " + (err as Error).message);
    } finally {
      setTBusy(false);
    }
  }

  async function handleAddStudent(e: FormEvent) {
    e.preventDefault();
    const name = sName.trim();
    const username = sUsername.trim().toLowerCase();
    let password = sPassword.trim();
    if (!name || !username || !sTeacherId) return;
    if (!sNoPwd && !password) return;
    if (sNoPwd) password = "";

    setSBusy(true);
    try {
      const created = await createUser({
        username,
        name,
        password,
        role: "student",
        teacherId: sTeacherId,
        capTrack: sCapTrack,
      });
      if (!created) {
        alert("Ese nombre de usuario ya existe.");
        return;
      }
      setSName("");
      setSUsername("");
      setSPassword("");
      setSNoPwd(false);
      setSCapTrack("mercancias");
      setSSuccess(true);
      setTimeout(() => setSSuccess(false), 3000);
      await refresh();
    } catch (err) {
      alert("Error al conectar: " + (err as Error).message);
    } finally {
      setSBusy(false);
    }
  }

  async function handleDelete(u: string, kind: "profesor" | "alumno") {
    if (!confirm(`¿Seguro que quieres borrar al ${kind} ${u}?`)) return;
    try {
      await deleteUser(u);
      await refresh();
    } catch (err) {
      alert("Error al borrar: " + (err as Error).message);
    }
  }

  async function handleAssign(username: string, teacherId: string) {
    if (!teacherId) return;
    try {
      await assignStudentToTeacher(username, teacherId);
      await refresh();
    } catch (err) {
      alert("Error al asignar: " + (err as Error).message);
    }
  }

  async function handleToggleSeed(u: string, enabled: boolean) {
    try {
      await setShowSeedBtn(u, enabled);
    } catch (err) {
      alert("Error al actualizar permiso: " + (err as Error).message);
    }
  }

  const titles: Record<AdminSection, { title: string; subtitle: string }> = {
    resumen: {
      title: "Resumen",
      subtitle: "Vista general de profesores y alumnos",
    },
    profesores: {
      title: "Profesores",
      subtitle: "Altas de autoescuela y listado",
    },
    alumnos: {
      title: "Alumnos",
      subtitle: "Altas, asignación y modalidad CAP",
    },
  };

  return (
    <StaffShell
      brand="Grupo CAP"
      eyebrow="Administración"
      userName={user?.name}
      userRole="Administrador"
      items={[
        { id: "resumen", label: "Resumen", icon: <IconLayoutDashboard /> },
        { id: "profesores", label: "Profesores", icon: <IconTeacher /> },
        { id: "alumnos", label: "Alumnos", icon: <IconUsers /> },
      ]}
      activeId={section}
      onSelect={(id) => setSection(id as AdminSection)}
      onLogout={logout}
      title={titles[section].title}
      subtitle={titles[section].subtitle}
    >
      {loadError && (
        <p className="mb-6 text-sm text-danger-500">Error al cargar usuarios.</p>
      )}

      <div className="mb-6">
        <StaffSearch
          value={query}
          onChange={setQuery}
          label="Buscar autoescuela o alumno"
          placeholder="Buscar autoescuela o alumno…"
        />
      </div>

      {section === "resumen" && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <article className="staff-stat">
            <p className="staff-stat-label">Profesores</p>
            <p className="staff-stat-value">
              {teachers === null ? "—" : counts.t}
            </p>
          </article>
          <article className="staff-stat is-accent">
            <p className="staff-stat-label">Alumnos</p>
            <p className="staff-stat-value">
              {students === null ? "—" : counts.s}
            </p>
          </article>
          <article className="staff-stat">
            <p className="staff-stat-label">CAP Mercancías</p>
            <p className="staff-stat-value">
              {students === null ? "—" : counts.mercancias}
            </p>
          </article>
          <article className="staff-stat">
            <p className="staff-stat-label">CAP Viajeros</p>
            <p className="staff-stat-value">
              {students === null ? "—" : counts.viajeros}
            </p>
          </article>
        </div>
      )}

      {section === "resumen" && teachers !== null && schoolNames.length > 0 && (
        <div className="staff-card mt-6">
          <h3 className="panel-heading">Periodo de prueba</h3>
          <ul className="staff-list">
            {schoolNames.map((school) => (
              <li key={school} className="staff-list-item">
                <span className="min-w-0 truncate font-bold text-ink-900">
                  {school}
                </span>
                <TrialBadge endsAt={schoolTrialEndsAt(teachers, school)} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {section === "resumen" && query.trim() && (
        <div className="staff-grid mt-6">
          <div className="staff-card">
            <h3 className="panel-heading">Autoescuelas</h3>
            <ul className="staff-list">
              {filteredSchools.length === 0 && (
                <li className="py-3 text-sm text-ink-600">
                  Ninguna autoescuela coincide.
                </li>
              )}
              {filteredSchools.map((school) => {
                const staff = (teachers ?? []).filter(
                  (t) => t.schoolName?.trim() === school
                );
                return (
                  <li key={school} className="staff-list-item">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => {
                        setQuery(school);
                        setSection("profesores");
                      }}
                    >
                      <span className="block truncate font-bold text-ink-900">
                        {school}
                      </span>
                      <span className="flex flex-wrap items-center gap-x-2 text-[13px] text-ink-400">
                        <span>
                          {staff.length}{" "}
                          {staff.length === 1 ? "profesor" : "profesores"}
                        </span>
                        <TrialBadge
                          endsAt={schoolTrialEndsAt(teachers, school)}
                        />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="staff-card">
            <h3 className="panel-heading">Alumnos</h3>
            <ul className="staff-list">
              {filteredStudents === null && (
                <li className="py-3 text-sm text-ink-600">Cargando...</li>
              )}
              {filteredStudents !== null && filteredStudents.length === 0 && (
                <li className="py-3 text-sm text-ink-600">
                  Ningún alumno coincide.
                </li>
              )}
              {filteredStudents?.map((u) => (
                <li key={u.username} className="staff-list-item">
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => {
                      setQuery(u.name);
                      setSection("alumnos");
                    }}
                  >
                    <span className="block truncate font-bold text-ink-900">
                      {u.name}
                    </span>
                    <span className="truncate text-[13px] text-ink-400">
                      {u.username} · {teacherLabel(u.teacherId)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {section === "profesores" && (
        <div className="staff-grid">
          <div className="staff-card">
            <h3 className="panel-heading">Añadir profesor / autoescuela</h3>
            <form onSubmit={handleAddTeacher} className="flex flex-col gap-3">
              <input
                type="text"
                className="input"
                placeholder="Nombre completo"
                required
                value={tName}
                onChange={(e) => setTName(e.target.value)}
              />
              <input
                type="text"
                className="input"
                placeholder="Usuario login"
                required
                value={tUsername}
                onChange={(e) => setTUsername(e.target.value)}
              />
              {schoolNames.length > 0 && (
                <select
                  className="input"
                  required
                  value={tSchoolChoice}
                  onChange={(e) => {
                    const next = e.target.value;
                    setTSchoolChoice(next);
                    if (next !== NEW_SCHOOL) setTSchool("");
                  }}
                >
                  <option value="" disabled>
                    Autoescuela
                  </option>
                  {schoolNames.map((school) => (
                    <option key={school} value={school}>
                      {school}
                    </option>
                  ))}
                  <option value={NEW_SCHOOL}>Nueva autoescuela…</option>
                </select>
              )}
              {creatingNewSchool && (
                <>
                  <input
                    type="text"
                    className="input"
                    placeholder={
                      schoolNames.length === 0
                        ? "Nombre de la autoescuela"
                        : "Nombre de la nueva autoescuela"
                    }
                    required
                    value={tSchool}
                    onChange={(e) => setTSchool(e.target.value)}
                  />
                  <select
                    className="input"
                    required
                    value={tTrialMonths}
                    onChange={(e) => setTTrialMonths(Number(e.target.value))}
                    aria-label="Periodo de prueba"
                  >
                    {TRIAL_MONTH_OPTIONS.map((months) => (
                      <option key={months} value={months}>
                        Periodo de prueba: {months}{" "}
                        {months === 1 ? "mes" : "meses"}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs font-medium text-ink-400">
                    El recuento de días empieza al registrar la autoescuela.
                    Solo lo ves tú en este panel.
                  </p>
                </>
              )}
              {!creatingNewSchool && tSchoolChoice && (
                <p className="flex items-center gap-2 px-1 text-sm">
                  <span className="text-ink-400">Prueba de esta autoescuela:</span>
                  <TrialBadge
                    endsAt={schoolTrialEndsAt(teachers, tSchoolChoice)}
                  />
                </p>
              )}
              <input
                type="password"
                className="input"
                placeholder="Contraseña"
                required
                value={tPassword}
                onChange={(e) => setTPassword(e.target.value)}
              />
              <button type="submit" className="btn-primary" disabled={tBusy}>
                {tBusy && <IconSpinner className="text-base" />}
                Crear profesor
              </button>
              {tSuccess && (
                <p className="success-text">Profesor creado con éxito</p>
              )}
            </form>
          </div>

          <div className="staff-card">
            <h3 className="panel-heading">Profesores registrados</h3>
            <ul className="staff-list">
              {filteredTeachers === null && !loadError && (
                <li className="py-3 text-sm text-ink-600">Cargando...</li>
              )}
              {filteredTeachers !== null && filteredTeachers.length === 0 && (
                <li className="py-3 text-sm text-ink-600">
                  {query.trim()
                    ? "Ningún profesor o autoescuela coincide."
                    : "No hay profesores registrados."}
                </li>
              )}
              {filteredTeachers?.map((u) => (
                <li key={u.username} className="staff-list-item">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-bold text-ink-900">
                      {u.name}
                    </span>
                    <span className="truncate text-[13px] text-ink-400">
                      {u.schoolName || "Sin autoescuela"} · {u.username}
                    </span>
                    {u.schoolName ? (
                      <TrialBadge
                        endsAt={schoolTrialEndsAt(teachers, u.schoolName)}
                      />
                    ) : null}
                  </div>
                  <button
                    className="btn-danger-soft shrink-0"
                    onClick={() => handleDelete(u.username, "profesor")}
                  >
                    Eliminar <IconTrash className="text-sm" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {section === "alumnos" && (
        <div className="staff-grid">
          <div className="staff-card">
            <h3 className="panel-heading">Añadir alumno</h3>
            <form onSubmit={handleAddStudent} className="flex flex-col gap-3">
              <input
                type="text"
                className="input"
                placeholder="Nombre completo"
                required
                value={sName}
                onChange={(e) => setSName(e.target.value)}
              />
              <input
                type="text"
                className="input"
                placeholder="Usuario login"
                required
                value={sUsername}
                onChange={(e) => setSUsername(e.target.value)}
              />
              <select
                className="input"
                required
                value={sTeacherId}
                onChange={(e) => setSTeacherId(e.target.value)}
              >
                <option value="" disabled>
                  Selecciona profesor / autoescuela
                </option>
                {(teachers ?? []).map((t) => (
                  <option key={t.username} value={t.username}>
                    {t.schoolName
                      ? `${t.schoolName} — ${t.name}`
                      : t.name}{" "}
                    ({t.username})
                  </option>
                ))}
              </select>
              <fieldset className="mb-1">
                <legend className="mb-2 text-sm font-semibold text-ink-600">
                  Modalidad CAP
                </legend>
                <div className="flex gap-2">
                  {(["mercancias", "viajeros"] as const).map((track) => (
                    <label
                      key={track}
                      className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-bold transition-colors ${
                        sCapTrack === track
                          ? "border-brand-500 bg-brand-50 text-brand-700"
                          : "border-line bg-white text-ink-600"
                      }`}
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        name="sCapTrack"
                        checked={sCapTrack === track}
                        onChange={() => setSCapTrack(track)}
                      />
                      {CAP_TRACK_LABELS[track]}
                    </label>
                  ))}
                </div>
              </fieldset>
              <input
                type="password"
                className="input"
                placeholder="Contraseña"
                required={!sNoPwd}
                disabled={sNoPwd}
                value={sPassword}
                onChange={(e) => setSPassword(e.target.value)}
              />
              <label className="mb-1 flex items-center gap-2 text-sm text-ink-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-brand-500"
                  checked={sNoPwd}
                  onChange={(e) => {
                    setSNoPwd(e.target.checked);
                    if (e.target.checked) setSPassword("");
                  }}
                />
                El alumno establecerá la contraseña al entrar
              </label>
              <button
                type="submit"
                className="btn-primary"
                disabled={sBusy || !(teachers && teachers.length > 0)}
              >
                {sBusy && <IconSpinner className="text-base" />}
                Crear alumno
              </button>
              {!(teachers && teachers.length > 0) && (
                <p className="text-sm text-ink-400">
                  Crea primero un profesor para poder asignar alumnos.
                </p>
              )}
              {sSuccess && (
                <p className="success-text">Alumno creado con éxito</p>
              )}
            </form>
          </div>

          <div className="staff-card">
            <h3 className="panel-heading">Alumnos registrados</h3>
            <ul className="staff-list">
              {filteredStudents === null && !loadError && (
                <li className="py-3 text-sm text-ink-600">Cargando alumnos...</li>
              )}
              {filteredStudents !== null && filteredStudents.length === 0 && (
                <li className="py-3 text-sm text-ink-600">
                  {query.trim()
                    ? "Ningún alumno o autoescuela coincide."
                    : "No hay alumnos registrados."}
                </li>
              )}
              {filteredStudents?.map((u) => (
                <li
                  key={u.username}
                  className="flex flex-col gap-2 border-b border-line py-4 last:border-b-0"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-bold text-ink-900">
                        {u.name}
                      </span>
                      <span className="text-[13px] text-ink-400">
                        Usuario: {u.username} · {CAP_TRACK_LABELS[u.capTrack]}
                      </span>
                      <span
                        className={`text-[12px] ${
                          u.teacherId ? "text-brand-600" : "text-danger-500"
                        }`}
                      >
                        {teacherLabel(u.teacherId)}
                      </span>
                    </div>
                    <button
                      className="btn-danger-soft shrink-0"
                      onClick={() => handleDelete(u.username, "alumno")}
                    >
                      Eliminar <IconTrash className="text-sm" />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {!u.teacherId && teachers && teachers.length > 0 && (
                      <select
                        className="rounded-lg border-2 border-ink-900/20 bg-white px-2 py-1 text-xs font-medium text-ink-900"
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAssign(u.username, e.target.value);
                          }
                        }}
                      >
                        <option value="" disabled>
                          Asignar profesor…
                        </option>
                        {teachers.map((t) => (
                          <option key={t.username} value={t.username}>
                            {t.schoolName || t.name}
                          </option>
                        ))}
                      </select>
                    )}
                    <label
                      className="seed-toggle"
                      title="Mostrar botón 'Datos de prueba' a este alumno"
                    >
                      <input
                        type="checkbox"
                        defaultChecked={u.showSeedBtn}
                        onChange={(e) =>
                          handleToggleSeed(u.username, e.target.checked)
                        }
                      />
                      <span>Datos prueba</span>
                    </label>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </StaffShell>
  );
}
