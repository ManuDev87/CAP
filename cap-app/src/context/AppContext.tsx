"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getUserDoc, loadWrongQuestions } from "@/lib/db";
import { loadExam } from "@/lib/tests";
import type { ExamMode, Question, SessionUser, TestMeta } from "@/lib/types";
import { ERRORS_EXAM_ID } from "@/lib/types";

export type Screen =
  | "login"
  | "set-password"
  | "backoffice"
  | "teacher"
  | "test-selection"
  | "mode-select"
  | "quiz"
  | "stats";

export interface ActiveExam {
  id: string;
  name: string;
  questions: Question[];
}

const USER_KEY = "cap_current_user";
const USER_NAME_KEY = "cap_current_user_name";
const USER_ROLE_KEY = "cap_current_user_role";

function screenForRole(role: SessionUser["role"]): Screen {
  if (role === "root") return "backoffice";
  if (role === "teacher") return "teacher";
  return "test-selection";
}

interface AppContextValue {
  hydrated: boolean;
  screen: Screen;
  user: SessionUser | null;
  activeExam: ActiveExam | null;
  quizMode: ExamMode | null;
  pendingPwdUser: { username: string; name: string; role?: SessionUser["role"] } | null;

  loginAs: (user: SessionUser) => void;
  requestSetPassword: (
    username: string,
    name: string,
    role?: SessionUser["role"]
  ) => void;
  logout: () => void;
  showLogin: () => void;
  selectTest: (test: TestMeta, pausedMode: ExamMode | null) => Promise<void>;
  startErrorTest: () => Promise<number>;
  chooseMode: (mode: ExamMode) => void;
  goToTestSelection: () => void;
  goToModeSelect: () => void;
  openStats: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [screen, setScreen] = useState<Screen>("login");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [activeExam, setActiveExam] = useState<ActiveExam | null>(null);
  const [quizMode, setQuizMode] = useState<ExamMode | null>(null);
  const [pendingPwdUser, setPendingPwdUser] = useState<{
    username: string;
    name: string;
    role?: SessionUser["role"];
  } | null>(null);

  // Restore the cached session on first load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const username = localStorage.getItem(USER_KEY);
      if (!username) {
        if (!cancelled) setHydrated(true);
        return;
      }

      if (username === "root") {
        const u: SessionUser = { username: "root", name: "root", role: "root" };
        if (!cancelled) {
          setUser(u);
          setScreen("backoffice");
          localStorage.setItem(USER_ROLE_KEY, "root");
          setHydrated(true);
        }
        return;
      }

      const cachedRole = localStorage.getItem(USER_ROLE_KEY);
      const cachedName = localStorage.getItem(USER_NAME_KEY) || username;

      try {
        const doc = await getUserDoc(username);
        if (cancelled) return;
        if (!doc) {
          localStorage.removeItem(USER_KEY);
          localStorage.removeItem(USER_NAME_KEY);
          localStorage.removeItem(USER_ROLE_KEY);
          setHydrated(true);
          return;
        }
        const role: SessionUser["role"] =
          doc.role === "teacher" ? "teacher" : "student";
        const u: SessionUser = {
          username,
          name: doc.name || cachedName,
          role,
        };
        setUser(u);
        localStorage.setItem(USER_NAME_KEY, u.name);
        localStorage.setItem(USER_ROLE_KEY, u.role);
        setScreen(screenForRole(u.role));
      } catch {
        if (cancelled) return;
        // Offline / error: fall back to cached role if present
        const role: SessionUser["role"] =
          cachedRole === "teacher"
            ? "teacher"
            : cachedRole === "root"
              ? "root"
              : "student";
        setUser({ username, name: cachedName, role });
        setScreen(screenForRole(role));
      }
      if (!cancelled) setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loginAs = useCallback((u: SessionUser) => {
    setUser(u);
    setPendingPwdUser(null);
    localStorage.setItem(USER_KEY, u.username);
    localStorage.setItem(USER_NAME_KEY, u.name);
    localStorage.setItem(USER_ROLE_KEY, u.role);
    setScreen(screenForRole(u.role));
  }, []);

  const requestSetPassword = useCallback(
    (username: string, name: string, role?: SessionUser["role"]) => {
      setPendingPwdUser({ username, name, role });
      setScreen("set-password");
    },
    []
  );

  const showLogin = useCallback(() => {
    setScreen("login");
    setPendingPwdUser(null);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setActiveExam(null);
    setQuizMode(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(USER_NAME_KEY);
    localStorage.removeItem(USER_ROLE_KEY);
    setScreen("login");
  }, []);

  const selectTest = useCallback(
    async (test: TestMeta, pausedMode: ExamMode | null) => {
      const questions = await loadExam(test.id);
      setActiveExam({ id: test.id, name: test.name, questions });
      if (pausedMode) {
        setQuizMode(pausedMode);
        setScreen("quiz");
      } else {
        setScreen("mode-select");
      }
    },
    []
  );

  /** Build a synthetic exam from the user's accumulated wrong questions. */
  const startErrorTest = useCallback(async () => {
    if (!user || user.role !== "student") return 0;
    const refs = await loadWrongQuestions(user.username);
    if (refs.length === 0) return 0;

    const byTest = new Map<string, Set<string>>();
    for (const ref of refs) {
      if (!byTest.has(ref.testId)) byTest.set(ref.testId, new Set());
      byTest.get(ref.testId)!.add(ref.questionNum);
    }

    const questions: Question[] = [];
    for (const [testId, nums] of byTest) {
      try {
        const exam = await loadExam(testId);
        for (const q of exam) {
          if (nums.has(q.num)) {
            questions.push({ ...q, sourceTestId: testId });
          }
        }
      } catch (err) {
        console.error(`No se pudo cargar el examen ${testId}`, err);
      }
    }

    if (questions.length === 0) return 0;

    setActiveExam({
      id: ERRORS_EXAM_ID,
      name: "Test de errores",
      questions,
    });
    setQuizMode(null);
    setScreen("mode-select");
    return questions.length;
  }, [user]);

  const chooseMode = useCallback((mode: ExamMode) => {
    setQuizMode(mode);
    setScreen("quiz");
  }, []);

  const goToTestSelection = useCallback(() => setScreen("test-selection"), []);
  const goToModeSelect = useCallback(() => setScreen("mode-select"), []);
  const openStats = useCallback(() => setScreen("stats"), []);

  const value = useMemo<AppContextValue>(
    () => ({
      hydrated,
      screen,
      user,
      activeExam,
      quizMode,
      pendingPwdUser,
      loginAs,
      requestSetPassword,
      logout,
      showLogin,
      selectTest,
      startErrorTest,
      chooseMode,
      goToTestSelection,
      goToModeSelect,
      openStats,
    }),
    [
      hydrated,
      screen,
      user,
      activeExam,
      quizMode,
      pendingPwdUser,
      loginAs,
      requestSetPassword,
      logout,
      showLogin,
      selectTest,
      startErrorTest,
      chooseMode,
      goToTestSelection,
      goToModeSelect,
      openStats,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}
