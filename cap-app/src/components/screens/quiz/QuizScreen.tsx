"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { testPdfUrls } from "@/lib/tests";
import { calculateScore } from "@/lib/scoring";
import {
  clearPausedState,
  loadPausedState,
  mergeWrongQuestions,
  removeWrongQuestions,
  savePausedState,
  saveResultStats,
} from "@/lib/db";
import type { AnsweredMap, AnswerMap, WrongQuestionRef } from "@/lib/types";
import { ERRORS_EXAM_ID } from "@/lib/types";
import OptionRow, { type OptionVisualState } from "@/components/quiz/OptionRow";
import {
  ConfirmFinishModal,
  PauseModal,
  ResultModal,
} from "@/components/quiz/QuizModals";
import {
  IconArrowLeft,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
  IconComment,
  IconHelp,
  IconLogout,
} from "@/components/icons";

type QuizModal = "confirm" | "pause" | "result" | null;

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (totalSeconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

export default function QuizScreen() {
  const {
    activeExam: exam,
    quizMode: mode,
    user,
    goToTestSelection,
    goToModeSelect,
  } = useApp();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<AnswerMap>({});
  const [hasAnswered, setHasAnswered] = useState<AnsweredMap>({});
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [modal, setModal] = useState<QuizModal>(null);
  const [timerStopped, setTimerStopped] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [modalBusy, setModalBusy] = useState(false);

  const questions = useMemo(() => exam?.questions ?? [], [exam]);
  const username = user && user.role === "student" ? user.username : null;

  // ---- Restore paused state (or start fresh), exactly like the legacy app ----
  useEffect(() => {
    if (!exam || !mode) return;
    let cancelled = false;

    (async () => {
      if (username) {
        try {
          const saved = await loadPausedState(username, exam.id, mode);
          if (!cancelled && saved) {
            setUserAnswers(saved.userAnswers);
            setHasAnswered(saved.hasAnswered);
            setSecondsElapsed(saved.secondsElapsed);
            setCurrentIndex(
              Math.min(saved.currentQuestionIndex, questions.length - 1)
            );
            setLoaded(true);
            return;
          }
        } catch (err) {
          console.error("Error loading state", err);
        }
        // No saved state -> make sure no stale pause doc remains
        clearPausedState(username, exam.id, mode).catch((err) =>
          console.error("Error clearing state", err)
        );
      }
      if (!cancelled) setLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Timer (stops when the result is shown / when leaving) ----
  useEffect(() => {
    if (!loaded || timerStopped) return;
    const interval = setInterval(
      () => setSecondsElapsed((s) => s + 1),
      1000
    );
    return () => clearInterval(interval);
  }, [loaded, timerStopped]);

  // ---- Mobile: pagination panel starts collapsed ----
  useEffect(() => {
    if (window.innerWidth <= 768) setPanelCollapsed(true);
  }, []);

  const selectExamenOption = useCallback(
    (optId: string) => {
      setUserAnswers((prev) => ({ ...prev, [currentIndex]: optId }));
    },
    [currentIndex]
  );

  const selectAyudaOption = useCallback(
    (optId: string) => {
      if (hasAnswered[currentIndex]) return;
      setUserAnswers((prev) => ({ ...prev, [currentIndex]: optId }));
      setHasAnswered((prev) => ({ ...prev, [currentIndex]: true }));
    },
    [currentIndex, hasAnswered]
  );

  if (!exam || !mode) return null;

  // Non-null captures for the handlers below (TS narrowing in closures)
  const examId = exam.id;
  const examName = exam.name;
  const examMode = mode;

  const q = questions[currentIndex];
  const questionAnsweredInAyuda = mode === "ayuda" && hasAnswered[currentIndex];

  function optionState(optId: string): OptionVisualState {
    if (isReviewMode) {
      if (optId === q.correct) return "correct";
      if (userAnswers[currentIndex] === optId) return "wrong";
      return "disabled-idle";
    }
    if (mode === "ayuda") {
      if (questionAnsweredInAyuda) {
        if (optId === q.correct) return "correct";
        if (userAnswers[currentIndex] === optId) return "wrong";
        return "disabled-idle";
      }
      return "idle";
    }
    return userAnswers[currentIndex] === optId ? "selected" : "idle";
  }

  function gridItemClass(idx: number): string {
    const classes = ["grid-item"];
    if (idx === currentIndex) classes.push("st-current");

    const answered = userAnswers[idx];
    const isCorrect = answered === questions[idx].correct;

    if (isReviewMode) {
      if (answered) classes.push(isCorrect ? "st-correct" : "st-wrong");
      else classes.push("st-unanswered");
    } else if (mode === "ayuda") {
      if (hasAnswered[idx]) classes.push(isCorrect ? "st-correct" : "st-wrong");
      else classes.push("st-unanswered");
    } else {
      classes.push(answered ? "st-answered" : "st-unanswered");
    }
    return classes.join(" ");
  }

  function tryFinishTest() {
    setModal("confirm");
  }

  async function handlePause() {
    setModalBusy(true);
    try {
      if (username) {
        await savePausedState(username, examId, examMode, {
          currentQuestionIndex: currentIndex,
          userAnswers,
          hasAnswered,
          secondsElapsed,
        });
      }
      setModal(null);
      goToTestSelection();
    } catch (err) {
      console.error("Error saving state", err);
      setModalBusy(false);
    }
  }

  async function handleEndTest() {
    setModalBusy(true);
    const breakdown = calculateScore(questions, userAnswers);
    const isErrorBank = examId === ERRORS_EXAM_ID;
    try {
      if (username) {
        await clearPausedState(username, examId, examMode).catch((err) =>
          console.error("Error clearing state", err)
        );

        if (isErrorBank) {
          // Remove questions the user got right from the error bank
          const solved: WrongQuestionRef[] = [];
          questions.forEach((q, i) => {
            const answered = userAnswers[i];
            if (answered && answered === q.correct && q.sourceTestId) {
              solved.push({
                testId: q.sourceTestId,
                questionNum: q.num,
              });
            }
          });
          await removeWrongQuestions(username, solved).catch((err) =>
            console.error("Error actualizando banco de errores", err)
          );
        } else {
          // Accumulate newly missed questions
          const wrongs: WrongQuestionRef[] = [];
          questions.forEach((q, i) => {
            const answered = userAnswers[i];
            if (answered && answered !== q.correct) {
              wrongs.push({ testId: examId, questionNum: q.num });
            }
          });
          await mergeWrongQuestions(username, wrongs).catch((err) =>
            console.error("Error guardando preguntas falladas", err)
          );

          await saveResultStats(
            username,
            examId,
            examName,
            breakdown.finalScore
          ).catch((err) => console.error("Error guardando resultado", err));
        }
      }
    } finally {
      setModalBusy(false);
      setTimerStopped(true);
      setModal("result");
    }
  }

  function enterReviewMode() {
    setModal(null);
    setIsReviewMode(true);
    setCurrentIndex(0);
  }

  function openPdf() {
    const url = testPdfUrls[examId];
    if (url) window.open(url, "_blank");
    else alert("El PDF original de este examen aún no está disponible.");
  }

  const unanswered = questions.length - Object.keys(userAnswers).length;
  const breakdown = modal === "result" ? calculateScore(questions, userAnswers) : null;

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="quiz-header">
        <div className="flex min-w-0 items-center gap-3.5 max-md:gap-2">
          <button
            className="header-avatar"
            title="Abrir examen original PDF"
            onClick={openPdf}
          >
            R
          </button>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm opacity-90 max-md:text-[10px]">
              {exam.name} - CAP Mercancías
            </span>
            <span className="truncate text-sm font-bold uppercase max-md:text-[9px]">
              GRUPO PERSONAL LINEROS
            </span>
          </div>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-5 max-md:gap-1.5">
          {isReviewMode && (
            <button
              className="finish-btn !bg-panelbg !text-ink-700"
              onClick={goToModeSelect}
            >
              <IconArrowLeft /> Volver al menú
            </button>
          )}
          <div className="flex flex-col items-end text-xs max-md:text-[9px]">
            <span>Tiempo empleado</span>
            <span className="text-base font-bold max-md:text-xs">
              {formatTime(secondsElapsed)}
            </span>
          </div>
          {!isReviewMode && (
            <button className="finish-btn" onClick={tryFinishTest}>
              <IconLogout /> Finalizar test
            </button>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className="flex w-37.5 shrink-0 flex-col gap-2.5 border-r-4 border-brand-500 bg-white px-2.5 py-5 max-md:hidden">
            <button className="side-btn">
              <IconHelp className="text-base" /> Ayuda
            </button>
            <button className="side-btn">
              <IconComment className="text-base" /> Comentario
            </button>
          </aside>

          {/* Main content */}
          <main className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-white p-10 max-md:px-3 max-md:pt-4 max-md:pb-5">
            <div className="flex-1">
              <div className="mb-7 flex gap-3.5 text-xl max-md:mb-4 max-md:gap-2 max-md:text-[15px]">
                <span className="font-bold">{currentIndex + 1}.</span>
                <p className="leading-snug">{q.question}</p>
              </div>

              <div
                className={`flex flex-col gap-6 pl-5 max-md:gap-3.5 max-md:pl-0 ${
                  !isReviewMode && mode === "examen" ? "mode-examen" : ""
                }`}
              >
                {q.options.map((opt) => (
                  <OptionRow
                    key={opt.id}
                    option={opt}
                    state={optionState(opt.id)}
                    onSelect={() =>
                      mode === "ayuda"
                        ? selectAyudaOption(opt.id)
                        : selectExamenOption(opt.id)
                    }
                  />
                ))}
              </div>
            </div>

            {/* Prev / Next navigation */}
            <div className="mt-10 flex items-center justify-between gap-2 border-t border-line pt-5 max-md:mt-5 max-md:pt-3">
              <button
                className="nav-btn max-md:px-3 max-md:py-2 max-md:text-xs"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              >
                <IconChevronLeft /> Anterior
              </button>
              <div className="text-sm text-ink-600 max-md:text-[11px]">
                Pregunta <span>{currentIndex + 1}</span> de{" "}
                <span>{questions.length}</span>
              </div>
              <button
                className="nav-btn max-md:px-3 max-md:py-2 max-md:text-xs"
                disabled={currentIndex === questions.length - 1}
                onClick={() =>
                  setCurrentIndex((i) =>
                    Math.min(questions.length - 1, i + 1)
                  )
                }
              >
                Siguiente <IconChevronRight />
              </button>
            </div>
          </main>
        </div>

        {/* Bottom pagination panel */}
        <div className="z-100 flex shrink-0 flex-col bg-line/70 max-md:border-t-[3px] max-md:border-brand-500">
          <div className="flex items-center justify-center border-y border-line bg-panelbg px-4 py-1.5">
            <button
              className="toggle-panel-btn"
              onClick={() => setPanelCollapsed((v) => !v)}
            >
              {panelCollapsed ? <IconChevronUp /> : <IconChevronDown />}
              <span>{panelCollapsed ? "Mostrar panel" : "Ocultar panel"}</span>
            </button>
          </div>

          {!panelCollapsed && (
            <div className="flex max-h-45 overflow-y-auto bg-white p-2.5 max-md:max-h-27.5">
              <div className="flex w-full flex-wrap content-start gap-0.5">
                {questions.map((_, idx) => (
                  <button
                    key={idx}
                    className={gridItemClass(idx)}
                    onClick={() => setCurrentIndex(idx)}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!panelCollapsed && (
            <div className="flex items-center gap-3.5 border-t border-ink-300/50 bg-appbg px-2.5 py-1.5 text-[11px] text-ink-600 max-md:hidden">
              <span className="font-bold">Leyenda:</span>
              <span className="box-leg leg-answered">contestada</span>
              <span className="box-leg leg-unanswered">no contestada</span>
              <span className="box-leg leg-correct">acertada</span>
              <span className="box-leg leg-wrong">fallada</span>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {modal === "confirm" && (
        <ConfirmFinishModal
          unanswered={unanswered}
          onAccept={() => setModal("pause")}
          onCancel={() => setModal(null)}
        />
      )}
      {modal === "pause" && (
        <PauseModal
          busy={modalBusy}
          onPause={handlePause}
          onEnd={handleEndTest}
        />
      )}
      {modal === "result" && breakdown && (
        <ResultModal
          breakdown={breakdown}
          onReview={enterReviewMode}
          onRestart={goToTestSelection}
        />
      )}
    </div>
  );
}
