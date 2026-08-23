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
import StaffShell from "@/components/staff/StaffShell";
import type { CapTrack } from "@/lib/types";
import { CAP_TRACK_LABELS } from "@/lib/types";

type AdminSection = "resumen" | "profesores" | "alumnos";

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
  const [tBusy, setTBusy] = useState(false);
  const [tSuccess, setTSuccess] = useState(false);

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
    const schoolName = tSchool.trim();
    if (!name || !username || !password || !schoolName) return;

    setTBusy(true);
    try {
      const created = await createUser({
        username,
        name,
        password,
        role: "teacher",
        schoolName,
      });
      if (!created) {
        alert("Ese nombre de usuario ya existe.");
        return;
      }
      setTName("");
      setTUsername("");
      setTPassword("");
      setTSchool("");
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
              <input
                type="text"
                className="input"
                placeholder="Nombre de la autoescuela"
                required
                value={tSchool}
                onChange={(e) => setTSchool(e.target.value)}
              />
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
              {teachers === null && !loadError && (
                <li className="py-3 text-sm text-ink-600">Cargando...</li>
              )}
              {teachers !== null && teachers.length === 0 && (
                <li className="py-3 text-sm text-ink-600">
                  No hay profesores registrados.
                </li>
              )}
              {teachers?.map((u) => (
                <li key={u.username} className="staff-list-item">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-bold text-ink-900">
                      {u.name}
                    </span>
                    <span className="truncate text-[13px] text-ink-400">
                      {u.schoolName || "Sin autoescuela"} · {u.username}
                    </span>
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
              {students === null && !loadError && (
                <li className="py-3 text-sm text-ink-600">Cargando alumnos...</li>
              )}
              {students !== null && students.length === 0 && (
                <li className="py-3 text-sm text-ink-600">
                  No hay alumnos registrados.
                </li>
              )}
              {students?.map((u) => (
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
