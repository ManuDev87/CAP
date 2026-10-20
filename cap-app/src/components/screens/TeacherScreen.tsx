"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useApp } from "@/context/AppContext";
import {
  ApiError,
  addStudentByTeacherRemote,
  connectOnboardRemote,
  createSchoolPackRemote,
  ensureCenterRemote,
  type CenterInfo,
} from "@/lib/api";
import {
  EURO_PER_MONTH,
  MAX_PAID_SEATS,
  PAID_MONTH_OPTIONS,
  PAID_SEAT_OPTIONS,
  formatPaidUntil,
  isActiveSchoolTrial,
  packTotal,
} from "@/lib/billing";
import {
  formatTrialLabel,
  remainingTrialDays,
} from "@/lib/trial";
import {
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
import StaffShell, {
  StaffSearch,
  matchesStaffQuery,
} from "@/components/staff/StaffShell";
import {
  IconArrowLeft,
  IconChart,
  IconSpinner,
  IconTrash,
  IconFileSign,
  IconQr,
  IconUserPlus,
  IconUsers,
} from "@/components/icons";

type TeacherSection = "alumnos" | "licencias" | "alta" | "seguimiento";

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
  const [studentQuery, setStudentQuery] = useState("");
  const [schoolCode, setSchoolCode] = useState(user?.schoolCode ?? "");
  const [inviteUrl, setInviteUrl] = useState("");
  const [centerBusy, setCenterBusy] = useState(false);
  const [seatsPurchased, setSeatsPurchased] = useState(0);
  const [seatsUsed, setSeatsUsed] = useState(0);
  const [seatsLeft, setSeatsLeft] = useState(0);
  const [packPaidUntil, setPackPaidUntil] = useState<number | null>(null);
  const [packActive, setPackActive] = useState(false);
  const [packSeats, setPackSeats] = useState(12);
  const [packMonths, setPackMonths] = useState(1);
  const [packCustomSeats, setPackCustomSeats] = useState("");
  const [packBusy, setPackBusy] = useState(false);
  const [packMsg, setPackMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  const applyCenter = useCallback((data: CenterInfo) => {
    setSchoolCode(data.schoolCode);
    setInviteUrl(data.inviteUrl);
    setSeatsPurchased(data.seatsPurchased);
    setSeatsUsed(data.seatsUsed);
    setSeatsLeft(data.seatsLeft);
    setPackPaidUntil(data.packPaidUntil);
    setPackActive(data.packActive);
  }, []);

  useEffect(() => {
    if (!teacherId) return;
    let cancelled = false;
    async function load() {
      try {
        const data = await ensureCenterRemote(teacherId);
        if (cancelled) return;
        applyCenter(data);
      } catch (err) {
        console.warn("No se pudo cargar el código de centro", err);
      }
    }
    void load();
    const params = new URLSearchParams(window.location.search);
    const pack = params.get("pack");
    if (pack === "1") {
      setSection("licencias");
      setPackMsg(
        "Pago recibido. Las plazas se actualizan cuando Stripe confirma (unos segundos)."
      );
      const t = window.setTimeout(() => {
        void load();
      }, 2500);
      return () => {
        cancelled = true;
        window.clearTimeout(t);
      };
    }
    if (pack === "0") setSection("licencias");
    return () => {
      cancelled = true;
    };
  }, [teacherId, applyCenter]);

  const trialDays =
    user?.trialEndsAt != null ? remainingTrialDays(user.trialEndsAt) : null;
  const hideBillingUi =
    (trialDays != null && trialDays >= 0 && !packActive) ||
    isActiveSchoolTrial({
      trialEndsAt: user?.trialEndsAt,
      packPaidUntil: packActive ? packPaidUntil : null,
    });

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

  const filteredStudents = useMemo(() => {
    if (!students) return null;
    return students.filter((u) =>
      matchesStaffQuery(
        studentQuery,
        u.name,
        u.username,
        CAP_TRACK_LABELS[u.capTrack]
      )
    );
  }, [students, studentQuery]);

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
      const result = await addStudentByTeacherRemote({
        teacherUsername: teacherId,
        username: u,
        name: n,
        password: p,
        capTrack,
      });
      setSeatsLeft(result.seatsLeft);
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
      if (err instanceof ApiError && err.status === 402) {
        if (hideBillingUi) {
          alert(
            "Durante la prueba puedes explorar la plataforma. El alta de alumnos se abre cuando termine el periodo de prueba."
          );
          return;
        }
        setSection("licencias");
        setPackMsg(
          "Sin plazas. Compra un pack o envía el enlace para que pague el alumno."
        );
        return;
      }
      alert(err instanceof ApiError ? err.message : "Error al conectar");
    } finally {
      setBusy(false);
    }
  }

  async function copyInvite() {
    if (trialBillingLocked()) return;
    const text = inviteUrl || schoolCode;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  function trialBillingLocked(): boolean {
    if (!hideBillingUi) return false;
    setSection("licencias");
    return true;
  }

  async function buyPack() {
    if (trialBillingLocked()) return;
    if (!teacherId) return;
    setPackBusy(true);
    try {
      const { url } = await createSchoolPackRemote(
        teacherId,
        selectedSeats,
        packMonths
      );
      if (!url) throw new ApiError("No se pudo abrir el pago", 500);
      window.location.href = url;
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "No se pudo abrir el pago");
      setPackBusy(false);
    }
  }

  async function openConnect() {
    if (trialBillingLocked()) return;
    if (!teacherId) return;
    setCenterBusy(true);
    try {
      const { url } = await connectOnboardRemote(teacherId);
      window.location.href = url;
    } catch (err) {
      alert(
        err instanceof ApiError
          ? err.message
          : "No se pudo abrir Stripe Connect"
      );
      setCenterBusy(false);
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

  const selectedSeats = useMemo(() => {
    const n = Number(packCustomSeats);
    if (Number.isInteger(n) && n >= 1 && n <= MAX_PAID_SEATS) return n;
    return packSeats;
  }, [packCustomSeats, packSeats]);

  const qrSrc = inviteUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(inviteUrl)}`
    : "";

  const navItems = [
    { id: "alumnos", label: "Mis alumnos", icon: <IconUsers /> },
    { id: "licencias", label: "Licencias", icon: <IconFileSign /> },
    { id: "alta", label: "Alta alumno", icon: <IconUserPlus /> },
    ...(selected
      ? [{ id: "seguimiento", label: "Seguimiento", icon: <IconChart /> }]
      : []),
  ];

  const heading =
    section === "alta"
      ? { title: "Alta de alumno", subtitle: "Crea un acceso para tu autoescuela" }
      : section === "licencias"
        ? {
            title: "Licencias",
            subtitle: "Compra plazas o envía el enlace para que pague el alumno",
          }
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
      userRole="Profesor"
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
      {trialDays != null && !packActive ? (
        <div className="staff-card mb-6">
          <p className="text-sm font-semibold text-ink-700">
            {trialDays >= 0
              ? `Prueba gratis · ${formatTrialLabel(trialDays)}`
              : "La prueba gratuita ha caducado"}
          </p>
          {hideBillingUi ? (
            <p className="mt-1 text-sm text-ink-500">
              Tienes un periodo de prueba gratis. El cobro de plazas y el pago
              del alumno se activan al terminar la prueba.
            </p>
          ) : (
            <p className="mt-1 text-sm text-ink-500">
              Puedes ver la plataforma. Para meter alumnos compra un pack de
              plazas o envía el enlace/QR para que paguen ellos.
            </p>
          )}
        </div>
      ) : null}

      {section === "alumnos" && (
        <>
          {schoolCode ? (
            <div className="staff-card mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink-500">Código de centro</p>
                <p className="font-mono text-xl font-bold tracking-wide text-brand-700">
                  {schoolCode}
                </p>
                <p className="mt-1 text-sm text-ink-500">
                  {hideBillingUi
                    ? "Tienes un periodo de prueba gratis"
                    : packActive
                      ? `${seatsLeft} plaza${seatsLeft === 1 ? "" : "s"} libre${seatsLeft === 1 ? "" : "s"}`
                      : "Sin pack activo: el alumno paga al registrarse"}
                </p>
              </div>
              <button
                type="button"
                className={`btn-ghost-brand !px-3.5 !py-2 !text-sm ${
                  hideBillingUi ? "opacity-50" : ""
                }`}
                onClick={() => setSection("licencias")}
              >
                Comprar plazas o enviar QR
              </button>
            </div>
          ) : null}
          <div className="mb-6">
            <StaffSearch
              value={studentQuery}
              onChange={setStudentQuery}
              label="Buscar alumno"
              placeholder="Buscar alumno…"
            />
          </div>
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
              {filteredStudents === null && !loadError && (
                <li className="py-3 text-sm text-ink-600">Cargando alumnos...</li>
              )}
              {loadError && (
                <li className="py-3 text-sm text-danger-500">
                  Error al cargar alumnos.
                </li>
              )}
              {filteredStudents !== null && filteredStudents.length === 0 && (
                <li className="py-3 text-sm text-ink-600">
                  {studentQuery.trim()
                    ? "Ningún alumno coincide con la búsqueda."
                    : hideBillingUi
                      ? "Aún no tienes alumnos."
                      : "Aún no tienes alumnos. Compra plazas o envía el enlace en Licencias."}
                </li>
              )}
              {filteredStudents?.map((u) => (
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

      {section === "licencias" && (
        <div className="relative">
        <div
          className={`grid gap-6 lg:grid-cols-2 ${
            hideBillingUi ? "pointer-events-none select-none opacity-40" : ""
          }`}
          aria-hidden={hideBillingUi || undefined}
        >
          <div className="staff-card">
            <h3 className="panel-heading">Comprar plazas</h3>
            <p className="mb-4 text-sm text-ink-500">
              Tú pagas {EURO_PER_MONTH} € × plaza × mes. El alumno entra con tu
              código y no paga. Un solo cobro, no es suscripción.
            </p>
            {packActive ? (
              <p className="mb-4 text-sm font-semibold text-brand-700">
                {seatsLeft} de {seatsPurchased} plazas libres
                {packPaidUntil
                  ? ` · hasta ${formatPaidUntil(packPaidUntil)}`
                  : ""}
                {seatsUsed ? ` · ${seatsUsed} en uso` : ""}
              </p>
            ) : (
              <p className="mb-4 text-sm font-semibold text-ink-600">
                Sin pack activo
              </p>
            )}
            <p className="mb-2 text-sm font-semibold text-ink-600">Plazas</p>
            <div className="mb-4 grid grid-cols-3 gap-2">
              {PAID_SEAT_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`rounded-xl border-2 px-2 py-3 text-sm font-bold transition ${
                    selectedSeats === n && !packCustomSeats
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-ink-900/15 text-ink-700 hover:border-brand-400"
                  }`}
                  onClick={() => {
                    setPackSeats(n);
                    setPackCustomSeats("");
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
            <label className="mb-4 block text-sm font-medium text-ink-600">
              Otra cantidad (1–{MAX_PAID_SEATS})
              <input
                type="number"
                min={1}
                max={MAX_PAID_SEATS}
                className="input mt-1"
                placeholder="Plazas"
                value={packCustomSeats}
                onChange={(e) => setPackCustomSeats(e.target.value)}
              />
            </label>
            <p className="mb-2 text-sm font-semibold text-ink-600">Meses</p>
            <div className="mb-4 grid grid-cols-5 gap-2">
              {PAID_MONTH_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`rounded-xl border-2 px-2 py-3 text-sm font-bold transition ${
                    packMonths === n
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-ink-900/15 text-ink-700 hover:border-brand-400"
                  }`}
                  onClick={() => setPackMonths(n)}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="mb-4 text-lg font-bold text-ink-900">
              {packTotal(selectedSeats, packMonths)} € · {selectedSeats} plazas
              · {packMonths} {packMonths === 1 ? "mes" : "meses"}
            </p>
            {packMsg ? (
              <p className="mb-3 text-sm font-medium text-brand-700">{packMsg}</p>
            ) : null}
            <button
              type="button"
              className="btn-primary w-full"
              disabled={packBusy}
              onClick={() => void buyPack()}
            >
              {packBusy && <IconSpinner className="text-base" />}
              {packBusy ? "Abriendo pago..." : "Pagar pack"}
            </button>
          </div>

          <div className="staff-card">
            <h3 className="panel-heading">Que pague el alumno</h3>
            <p className="mb-4 text-sm text-ink-500">
              Envía el enlace o el QR. El alumno se registra con tu código y
              paga {EURO_PER_MONTH} € × los meses que elija. Tú cobras 1 € por
              mes si activas Stripe Connect.
            </p>
            {schoolCode ? (
              <p className="mb-2 font-mono text-2xl font-bold tracking-wide text-brand-700">
                {schoolCode}
              </p>
            ) : null}
            {inviteUrl ? (
              <p className="mb-3 break-all text-sm font-medium text-ink-600">
                {inviteUrl}
              </p>
            ) : null}
            {qrSrc ? (
              <div className="mb-4 flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrSrc}
                  alt="QR de alta de alumno"
                  width={220}
                  height={220}
                  className="rounded-xl border border-line bg-white p-2"
                />
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-ghost-brand !px-3.5 !py-2 !text-sm"
                onClick={() => void copyInvite()}
              >
                {copied ? "Copiado" : "Copiar enlace"}
              </button>
              <button
                type="button"
                className="btn-ghost-brand !px-3.5 !py-2 !text-sm"
                disabled={centerBusy}
                onClick={() => void openConnect()}
              >
                {centerBusy && <IconSpinner className="text-base" />}
                Cobrar 1 € automático
              </button>
            </div>
          </div>
        </div>
        {hideBillingUi ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
            <div className="staff-card max-w-md text-center shadow-lg">
              <p className="text-base font-bold text-ink-900">
                Tienes un periodo de prueba gratis
              </p>
              <p className="mt-2 text-sm text-ink-500">
                {trialDays != null ? `${formatTrialLabel(trialDays)}. ` : ""}
                Comprar plazas y el enlace de pago del alumno se activan al
                terminar la prueba.
              </p>
            </div>
          </div>
        ) : null}
        </div>
      )}

      {section === "alta" && (
        <div className="mx-auto max-w-xl">
          {!packActive || seatsLeft < 1 ? (
            <div className="staff-card">
              <h3 className="panel-heading">Para meter alumnos</h3>
              <p className="mb-4 text-sm text-ink-500">
                {hideBillingUi
                  ? "Tienes un periodo de prueba gratis. El cobro de plazas y el pago del alumno se activan al terminar la prueba."
                  : "La prueba sirve para ver la plataforma. Un alumno entra con una plaza de pack o pagando él."}
              </p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setSection("licencias")}
                >
                  Comprar pack de plazas
                </button>
                <button
                  type="button"
                  className="btn-ghost-brand"
                  onClick={() => setSection("licencias")}
                >
                  <IconQr className="text-base" /> Enviar enlace o QR
                </button>
              </div>
            </div>
          ) : (
          <div className="staff-card">
            <h3 className="panel-heading">Nuevo alumno</h3>
            {!hideBillingUi ? (
              <p className="mb-3 text-sm text-ink-500">
                Esta alta usa 1 plaza del pack ({seatsLeft} libres).
              </p>
            ) : null}
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
          )}
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
