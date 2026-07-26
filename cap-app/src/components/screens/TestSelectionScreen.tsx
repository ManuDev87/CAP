"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "@/context/AppContext";
import { communityRegions } from "@/lib/tests";
import { loadAllResultStats, loadPausedMap } from "@/lib/db";
import type { ExamMode, TestMeta, TestResultStats } from "@/lib/types";
import {
  IconChart,
  IconCheckBadge,
  IconCrossBadge,
  IconLogout,
  IconPdf,
  IconSpinner,
} from "@/components/icons";

export default function TestSelectionScreen() {
  const { user, selectTest, openStats, logout } = useApp();

  const [pausedMap, setPausedMap] = useState<Map<string, ExamMode>>(new Map());
  const [statsMap, setStatsMap] = useState<Map<string, TestResultStats>>(
    new Map()
  );
  const [loadingTest, setLoadingTest] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [regionId, setRegionId] = useState(communityRegions[0]?.id ?? "andalucia");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeRegion = useMemo(
    () =>
      communityRegions.find((r) => r.id === regionId) ?? communityRegions[0],
    [regionId]
  );
  const regionTests = activeRegion?.tests ?? [];

  // Load paused indicators + pass/fail badges
  useEffect(() => {
    if (!user || user.role !== "student") return;
    let cancelled = false;
    (async () => {
      try {
        const [paused, stats] = await Promise.all([
          loadPausedMap(user.username),
          loadAllResultStats(user.username),
        ]);
        if (!cancelled) {
          setPausedMap(paused);
          setStatsMap(stats);
        }
      } catch (err) {
        console.error("Error cargando datos de tests", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Close the user dropdown when clicking outside
  useEffect(() => {
    if (!dropdownOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [dropdownOpen]);

  async function handleSelect(test: TestMeta) {
    if (loadingTest) return;
    setLoadingTest(test.id);
    try {
      await selectTest(test, pausedMap.get(test.id) ?? null);
    } catch (err) {
      console.error(err);
      alert("Base de datos no encontrada para este test.");
      setLoadingTest(null);
    }
  }

  return (
    <div className="screen-overlay gradient-selection z-3000 px-5 py-10 max-md:p-2.5">
      <div className="panel-card mx-auto mb-10 max-w-275 overflow-hidden max-md:mt-1.5">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-line bg-white px-7 py-6 max-md:px-4 max-md:py-4">
          <div className="selection-heading">
            <span className="selection-heading-bar" aria-hidden="true" />
            <div>
              <p className="selection-heading-kicker">Portal del alumno</p>
              <h2 className="selection-heading-title">Selecciona un test</h2>
            </div>
          </div>
          <div className="relative" ref={dropdownRef}>
            <button
              className="user-pill"
              title="Opciones de usuario"
              onClick={(e) => {
                e.stopPropagation();
                setDropdownOpen((v) => !v);
              }}
            >
              <span className="max-w-37.5 truncate text-base font-bold text-ink-900 max-md:max-w-24 max-md:text-sm">
                {user?.name ?? "Alumno"}
              </span>
              <span className="block h-9.5 w-9.5 shrink-0 overflow-hidden rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/img/user-avatar.png"
                  alt="Avatar Usuario"
                  className="h-full w-full object-cover"
                />
              </span>
            </button>
            {dropdownOpen && (
              <div className="user-dropdown">
                <button
                  className="dropdown-item dropdown-stats"
                  onClick={() => {
                    setDropdownOpen(false);
                    openStats();
                  }}
                >
                  <IconChart className="w-5 text-center text-lg" />
                  Estadísticas
                </button>
                <button
                  className="dropdown-item dropdown-logout"
                  onClick={logout}
                >
                  <IconLogout className="w-5 text-center text-lg" />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Community tabs */}
        <div className="region-tabs" role="tablist" aria-label="Comunidad autónoma">
          {communityRegions.map((region) => (
            <button
              key={region.id}
              type="button"
              role="tab"
              aria-selected={region.id === regionId}
              className={`region-tab ${
                region.id === regionId ? "region-tab-active" : ""
              }`}
              onClick={() => setRegionId(region.id)}
            >
              {region.name}
              {region.tests.length > 0 && (
                <span className="ml-1.5 opacity-80">({region.tests.length})</span>
              )}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3.5 bg-panelbg p-5 max-md:grid-cols-2 max-md:gap-2 max-md:p-2.5">
          {regionTests.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-ink-900/20 bg-white px-5 py-12 text-center">
              <p className="text-base font-bold text-ink-900">
                {activeRegion?.name}
              </p>
              <p className="mt-1.5 text-sm text-ink-400">
                Todavía no hay tests disponibles para esta comunidad.
              </p>
            </div>
          )}

          {regionTests.map((test) => {
            const paused = pausedMap.has(test.id);
            const stats = statsMap.get(test.id);
            return (
              <div
                key={test.id}
                className="test-card group"
                onClick={() => handleSelect(test)}
              >
                {paused && (
                  <div className="paused-indicator" title="Test pausado">
                    <div className="paused-bar" />
                    <div className="paused-bar" />
                  </div>
                )}
                {stats && (stats.passes > 0 || stats.fails > 0) && (
                  <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 max-md:flex-row max-md:flex-wrap">
                    {stats.passes > 0 && (
                      <div className="stat-badge">
                        <IconCheckBadge />
                        <span>x{stats.passes}</span>
                      </div>
                    )}
                    {stats.fails > 0 && (
                      <div className="stat-badge">
                        <IconCrossBadge />
                        <span>x{stats.fails}</span>
                      </div>
                    )}
                  </div>
                )}
                {loadingTest === test.id && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-navy-900/60 text-3xl text-white">
                    <IconSpinner />
                  </div>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={test.img}
                  alt={test.name}
                  className="transition-transform duration-300 group-hover:scale-105 group-hover:opacity-100"
                />
                <div className="test-card-label">{test.name}</div>
              </div>
            );
          })}

          {/* Plantilla CAP PDF — only with Andalucía for now */}
          {regionId === "andalucia" && (
            <div
              className="test-card group border-2 border-dashed border-brand-500 !bg-white"
              onClick={() => window.open("/Plantilla_Cap.pdf", "_blank")}
            >
              <div className="flex h-full w-full items-center justify-center pb-5">
                <IconPdf className="text-5xl text-danger-500 drop-shadow-md transition-transform duration-300 group-hover:scale-110" />
              </div>
              <div className="test-card-label justify-center bg-white/95">
                Plantilla CAP
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
