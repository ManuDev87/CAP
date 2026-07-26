"use client";

import { AppProvider, useApp } from "@/context/AppContext";
import LoginScreen from "@/components/screens/LoginScreen";
import SetPasswordScreen from "@/components/screens/SetPasswordScreen";
import BackofficeScreen from "@/components/screens/BackofficeScreen";
import TeacherScreen from "@/components/screens/TeacherScreen";
import TestSelectionScreen from "@/components/screens/TestSelectionScreen";
import ModeSelectScreen from "@/components/screens/ModeSelectScreen";
import QuizScreen from "@/components/screens/quiz/QuizScreen";
import StatsScreen from "@/components/screens/StatsScreen";

function Splash() {
  return (
    <div className="screen-overlay gradient-auth z-5000 flex flex-col items-center justify-center gap-5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/img/logo.png" alt="Logo Grupo CAP" className="splash-logo" />
      <div className="brand-badge">Grupo CAP</div>
    </div>
  );
}

function Screens() {
  const { hydrated, screen } = useApp();

  if (!hydrated) return <Splash />;

  switch (screen) {
    case "login":
      return <LoginScreen />;
    case "set-password":
      return <SetPasswordScreen />;
    case "backoffice":
      return <BackofficeScreen />;
    case "teacher":
      return <TeacherScreen />;
    case "test-selection":
      return <TestSelectionScreen />;
    case "mode-select":
      return <ModeSelectScreen />;
    case "quiz":
      return <QuizScreen />;
    case "stats":
      return <StatsScreen />;
  }
}

export default function AppRoot() {
  return (
    <AppProvider>
      <Screens />
    </AppProvider>
  );
}
