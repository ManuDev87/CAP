"use client";

import { PASS_THRESHOLD, formatScore } from "@/lib/scoring";
import type { QuestionHelp, ScoreBreakdown } from "@/lib/types";
import {
  IconExternalLink,
  IconPauseCircle,
  IconSpinner,
  IconWarning,
  IconX,
} from "@/components/icons";

/* ---------- Confirm finish ---------- */

interface ConfirmFinishModalProps {
  unanswered: number;
  onAccept: () => void;
  onCancel: () => void;
}

export function ConfirmFinishModal({
  unanswered,
  onAccept,
  onCancel,
}: ConfirmFinishModalProps) {
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="mb-5 text-6xl text-warn-500">
          <IconWarning />
        </div>
        <h2 className="mb-2.5 text-[22px] font-bold text-ink-900">
          ¿Dar por finalizado el test?
        </h2>
        <p
          className={`mt-2.5 mb-6 font-medium ${
            unanswered > 0 ? "text-danger-500" : "text-ok-600"
          }`}
        >
          {unanswered > 0
            ? `Aún quedan ${unanswered} preguntas sin contestar.`
            : "Has contestado todas las preguntas."}
        </p>
        <div className="modal-actions mt-0">
          <button className="btn-primary" onClick={onAccept}>
            Aceptar
          </button>
          <button className="btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Pause or finish ---------- */

interface PauseModalProps {
  busy: boolean;
  onPause: () => void;
  onEnd: () => void;
}

export function PauseModal({ busy, onPause, onEnd }: PauseModalProps) {
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="mb-5 text-6xl text-info-500">
          <IconPauseCircle />
        </div>
        <h2 className="mb-2.5 text-[22px] font-bold text-ink-900">
          ¿Guardar progreso?
        </h2>
        <p className="mb-6 leading-relaxed text-ink-600">
          Puede pausar el test para continuarlo más adelante, o darlo por
          terminado para ver su nota ahora.
        </p>
        <div className="modal-actions mt-0">
          <button className="btn-primary" onClick={onPause} disabled={busy}>
            {busy && <IconSpinner className="text-base" />}
            Sí, pausar test
          </button>
          <button className="btn-secondary" onClick={onEnd} disabled={busy}>
            No, ver nota final
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Results ---------- */

interface ResultModalProps {
  breakdown: ScoreBreakdown;
  onReview: () => void;
  onRestart: () => void;
}

export function ResultModal({
  breakdown,
  onReview,
  onRestart,
}: ResultModalProps) {
  const { correct, wrong, bonusCorrect, finalScore } = breakdown;
  const passed = finalScore >= PASS_THRESHOLD;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2 className="mb-5 text-[22px] font-bold text-brand-500">
          Resultados del Test
        </h2>

        <div className="score-breakdown">
          <div className="score-row">
            <span>✅ Respuestas correctas:</span>
            <span>
              <strong>{correct}</strong> pts
            </span>
          </div>
          <div className="score-row">
            <span>❌ Respuestas incorrectas:</span>
            <span>
              <strong>{(-wrong * 0.5).toFixed(1)}</strong> pts
            </span>
          </div>
          <div className="score-row">
            <span>⬜ Sin contestar:</span>
            <span>
              <strong>0</strong> pts
            </span>
          </div>
          <div className={`score-row score-row-total ${passed ? "" : "fail"}`}>
            <span>📊 PUNTUACIÓN FINAL:</span>
            <span>
              <strong>{formatScore(finalScore)}</strong> / 100
            </span>
          </div>
          <div className="score-row score-row-bonus">
            <span>ℹ️ Preguntas de reserva (101-103):</span>
            <span>
              <strong>{bonusCorrect}</strong> aciertos
            </span>
          </div>
        </div>

        {passed ? (
          <p className="mb-7 text-2xl font-bold text-ok-500">🎉 ¡APROBADO!</p>
        ) : (
          <p className="mb-7 text-2xl font-bold text-danger-500">
            ❌ No Aprobado
          </p>
        )}
        <p className="mb-4 text-xs text-ink-400">
          Para aprobar se necesitan <strong>mínimo 50 puntos</strong>.
        </p>

        <div className="modal-actions mt-0">
          <button className="btn-primary" onClick={onReview}>
            Revisar respuestas
          </button>
          <button className="btn-secondary" onClick={onRestart}>
            Volver al menú
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Answer help (fundamento) ---------- */

interface HelpModalProps {
  help: QuestionHelp;
  onClose: () => void;
}

export function HelpModal({ help, onClose }: HelpModalProps) {
  const badge = help.verified
    ? help.origin === "official-ref"
      ? "Cita del examen de referencia"
      : "Normativa / temario oficial"
    : "Temario CAP";

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="help-modal"
        role="dialog"
        aria-labelledby="help-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="help-badge">{badge}</p>
            <h2
              id="help-modal-title"
              className="mt-2 text-left text-[20px] font-bold text-ink-900"
            >
              ¿Por qué es correcta?
            </h2>
          </div>
          <button
            className="help-close"
            onClick={onClose}
            aria-label="Cerrar ayuda"
          >
            <IconX />
          </button>
        </div>

        <p className="help-correct-label">Respuesta correcta</p>
        <p className="help-correct-text">{help.correctText}</p>

        <div className="help-body">
          {help.explanation.split("\n").map((line, i) =>
            line ? <p key={i}>{line}</p> : <br key={i} />
          )}
        </div>

        {help.source && (
          <div className="help-source">
            <p className="help-correct-label">Fuente</p>
            {help.sourceUrl ? (
              <a
                href={help.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="help-source-link"
              >
                {help.source}
                <IconExternalLink className="text-sm" />
              </a>
            ) : (
              <p className="text-sm leading-relaxed text-ink-700">
                {help.source}
              </p>
            )}
          </div>
        )}

        <button className="btn-primary mt-6 w-full" onClick={onClose}>
          Entendido
        </button>
      </div>
    </div>
  );
}
