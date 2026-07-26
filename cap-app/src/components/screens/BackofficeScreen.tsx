"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
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
import { IconLogout, IconSpinner, IconTrash } from "@/components/icons";

export default function BackofficeScreen() {
  const { logout } = useApp();

  const [teachers, setTeachers] = useState<UserListEntry[] | null>(null);
  const [students, setStudents] = useState<UserListEntry[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  // Teacher form
  const [tName, setTName] = useState("");
  const [tUsername, setTUsername] = useState("");
  const [tPassword, setTPassword] = useState("");
  const [tSchool, setTSchool] = useState("");
  const [tBusy, setTBusy] = useState(false);
  const [tSuccess, setTSuccess] = useState(false);

  // Student form
  const [sName, setSName] = useState("");
  const [sUsername, setSUsername] = useState("");
  const [sPassword, setSPassword] = useState("");
  const [sNoPwd, setSNoPwd] = useState(false);
  const [sTeacherId, setSTeacherId] = useState("");
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
      });
      if (!created) {
        alert("Ese nombre de usuario ya existe.");
        return;
      }
      setSName("");
      setSUsername("");
      setSPassword("");
      setSNoPwd(false);
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

  return (
    <div className="screen-overlay z-4000 bg-appbg px-5 py-10 max-md:px-2.5 max-md:py-4">
      <div className="panel-card mx-auto max-w-275 overflow-hidden">
        <div className="flex items-center justify-between bg-navy-700 px-7 py-5 text-white max-md:px-4">
          <h2 className="text-xl font-medium max-md:text-lg">
            Panel de Administración
          </h2>
          <button onClick={logout} className="btn-ghost-light">
            <IconLogout className="text-base" /> Salir
          </button>
        </div>

        {loadError && (
          <p className="px-7 pt-5 text-sm text-danger-500">
            Error al cargar usuarios.
          </p>
        )}

        {/* Teachers */}
        <div className="grid gap-7 border-b border-line p-7 md:grid-cols-2 max-md:p-4">
          <div className="rounded-xl border border-line bg-surface p-5">
            <h3 className="panel-heading">Añadir Profesor / Autoescuela</h3>
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
                Crear Profesor
              </button>
              {tSuccess && (
                <p className="success-text">Profesor creado con éxito</p>
              )}
            </form>
          </div>

          <div className="rounded-xl border border-line bg-surface p-5">
            <h3 className="panel-heading">Profesores Registrados</h3>
            <ul className="max-h-75 list-none overflow-y-auto">
              {teachers === null && !loadError && (
                <li className="py-3 text-sm text-ink-600">Cargando...</li>
              )}
              {teachers !== null && teachers.length === 0 && (
                <li className="py-3 text-sm text-ink-600">
                  No hay profesores registrados.
                </li>
              )}
              {teachers?.map((u) => (
                <li
                  key={u.username}
                  className="flex items-center justify-between gap-2 border-b border-line py-3 last:border-b-0"
                >
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

        {/* Students */}
        <div className="grid gap-7 p-7 md:grid-cols-2 max-md:p-4">
          <div className="rounded-xl border border-line bg-surface p-5">
            <h3 className="panel-heading">Añadir Nuevo Alumno</h3>
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
                Crear Alumno
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

          <div className="rounded-xl border border-line bg-surface p-5">
            <h3 className="panel-heading">Alumnos Registrados</h3>
            <ul className="max-h-100 list-none overflow-y-auto">
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
                  className="flex flex-col gap-2 border-b border-line py-3 last:border-b-0"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-bold text-ink-900">
                        {u.name}
                      </span>
                      <span className="text-[13px] text-ink-400">
                        Usuario: {u.username}
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
      </div>
    </div>
  );
}
