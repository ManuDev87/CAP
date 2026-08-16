"use client";

import { useApp } from "@/context/AppContext";
import { CAP_TRACK_LABELS, type CapTrack } from "@/lib/types";
import { TRACK_LOGOS } from "@/lib/capTrack";
import { IconLogout } from "@/components/icons";

export default function TrackSelectScreen() {
  const { user, chooseTrack, logout } = useApp();
  const allowed = user?.capTrack ?? "mercancias";

  function pick(track: CapTrack) {
    if (track !== allowed) {
      alert(
        track === "viajeros"
          ? "Tu cuenta está registrada en CAP Mercancías. Pide a tu profesor que te dé de alta en Viajeros."
          : "Tu cuenta está registrada en CAP Viajeros. Pide a tu profesor que te dé de alta en Mercancías."
      );
      return;
    }
    chooseTrack(track);
  }

  return (
    <div className="screen-overlay gradient-selection z-3000 flex items-center justify-center px-5 py-10 max-md:p-2.5">
      <div className="panel-card mx-auto w-full max-w-150 overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-line bg-white px-7 py-6 max-md:px-4 max-md:py-4">
          <div className="selection-heading">
            <span className="selection-heading-bar" aria-hidden="true" />
            <div>
              <p className="selection-heading-kicker">Portal del alumno</p>
              <h2 className="selection-heading-title">Elige tu CAP</h2>
            </div>
          </div>
          <button onClick={logout} className="btn-ghost-brand !px-3 !py-2 !text-sm">
            <IconLogout className="text-base" /> Salir
          </button>
        </div>

        <p className="border-b border-line bg-panelbg px-7 py-3 text-sm text-ink-600 max-md:px-4">
          Hola, <strong className="text-ink-900">{user?.name}</strong>. Entra en
          la modalidad en la que te ha inscrito tu profesor.
        </p>

        <div className="grid gap-4 bg-panelbg p-5 sm:grid-cols-2 max-md:p-3">
          {(["mercancias", "viajeros"] as const).map((track) => {
            const enabled = track === allowed;
            return (
              <button
                key={track}
                type="button"
                onClick={() => pick(track)}
                className={`track-card group ${
                  enabled ? "track-card-enabled" : "track-card-locked"
                }`}
              >
                <span className="track-card-img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={TRACK_LOGOS[track]}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </span>
                <span className="track-card-body">
                  <span className="text-lg font-bold text-ink-900">
                    {CAP_TRACK_LABELS[track]}
                  </span>
                  <span className="mt-1 text-sm text-ink-400">
                    {enabled
                      ? `Entrar a tests de ${CAP_TRACK_LABELS[track].toLowerCase()}`
                      : "No está en tu inscripción"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
