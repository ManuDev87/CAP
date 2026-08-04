"use client";

import { useApp } from "@/context/AppContext";
import { IconFileSign, IconTeacher } from "@/components/icons";

export default function ModeSelectScreen() {
  const { activeExam, chooseMode, goToTestSelection } = useApp();

  return (
    <div className="screen-overlay z-2000 flex items-center justify-center bg-brand-500">
      <div className="auth-card max-w-150 max-md:w-[95%] max-md:p-5">
        <div className="auth-brand">
          <div className="auth-brand-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/img/logo.png"
              alt="Logo Grupo CAP"
              className="junta-logo"
            />
          </div>
          <div className="brand-badge">Grupo CAP</div>
        </div>

        <p className="mb-7 text-ink-600 max-md:mb-4 max-md:text-[13px]">
          {activeExam?.id === "errores" ? (
            <>
              Vas a practicar{" "}
              <strong>{activeExam.questions.length} preguntas falladas</strong>.
              Elige el modo:
            </>
          ) : (
            <>
              Has seleccionado el <strong>{activeExam?.name ?? "Test"}</strong>.
              Elige el modo:
            </>
          )}
        </p>

        <div className="flex justify-center gap-5 max-md:flex-col max-md:gap-2.5">
          <button
            onClick={() => chooseMode("examen")}
            className="group flex flex-1 cursor-pointer flex-col items-center rounded-2xl border-[3px] border-ink-900/12 bg-appbg/70 p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-brand-500 hover:bg-brand-50/50 hover:shadow-card max-md:p-3.5"
          >
            <div className="mb-3.5 text-[40px] text-brand-500 transition-colors duration-200 group-hover:text-brand-600 max-md:mb-1.5 max-md:text-[28px]">
              <IconFileSign />
            </div>
            <h3 className="mb-2.5 font-display text-lg font-bold text-brand-700 max-md:mb-1 max-md:text-sm">
              Modo Examen
            </h3>
            <p className="text-sm leading-relaxed text-ink-600 max-md:text-xs">
              Evalúa tus conocimientos. Sin ayudas visuales hasta finalizar el
              test.
            </p>
          </button>

          <button
            onClick={() => chooseMode("ayuda")}
            className="group flex flex-1 cursor-pointer flex-col items-center rounded-2xl border-[3px] border-ink-900/12 bg-appbg/70 p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-brand-500 hover:bg-brand-50/50 hover:shadow-card max-md:p-3.5"
          >
            <div className="mb-3.5 text-[40px] text-brand-500 transition-colors duration-200 group-hover:text-brand-600 max-md:mb-1.5 max-md:text-[28px]">
              <IconTeacher />
            </div>
            <h3 className="mb-2.5 font-display text-lg font-bold text-brand-700 max-md:mb-1 max-md:text-sm">
              Modo Ayuda
            </h3>
            <p className="text-sm leading-relaxed text-ink-600 max-md:text-xs">
              Ideal para practicar. Te mostrará los aciertos y fallos en el
              momento.
            </p>
          </button>
        </div>

        <button
          onClick={goToTestSelection}
          className="btn-ghost-brand mt-7 max-md:mt-5"
        >
          Cambiar de Test
        </button>
      </div>
    </div>
  );
}
