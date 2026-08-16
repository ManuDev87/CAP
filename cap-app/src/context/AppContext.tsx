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
import { useRouter } from "next/navigation";
import { getUserDoc, loadWrongQuestions } from "@/lib/db";
import {
  PORTAL_PATHS,
  portalForRole,
  type Portal,
} from "@/lib/portal";
import { loadExam } from "@/lib/tests";
import type { CapTrack, ExamMode, Question, SessionUser, TestMeta } from "@/lib/types";
import { ERRORS_EXAM_ID, normalizeCapTrack } from "@/lib/types";

export type Screen =
  | "login"
  | "set-password"
  | "backoffice"
  | "teacher"
  | "track-select"
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
const TRACK_KEY = "cap_selected_track";

function screenForRole(role: SessionUser["role"]): Screen {
  if (role === "root") return "backoffice";
  if (role === "teacher") return "teacher";
  return "track-select";
}

interface AppContextValue {
  hydrated: boolean;
  portal: Portal;
  screen: Screen;
  user: SessionUser | null;
  selectedTrack: CapTrack | null;
  activeExam: ActiveExam | null;
  quizMode: ExamMode | null;
  pendingPwdUser: {
    username: string;
    name: string;
    role?: SessionUser["role"];
    capTrack?: CapTrack;
  } | null;

  loginAs: (user: SessionUser) => void;
  requestSetPassword: (
    username: string,
    name: string,
    role?: SessionUser["role"],
    capTrack?: CapTrack
  ) => void;
  logout: () => void;
  showLogin: () => void;
  chooseTrack: (track: CapTrack) => void;
  goToTrackSelect: () => void;
  selectTest: (test: TestMeta, pausedMode: ExamMode | null) => Promise<void>;
  startErrorTest: () => Promise<number>;
  chooseMode: (mode: ExamMode) => void;
  goToTestSelection: () => void;
  goToModeSelect: () => void;
  openStats: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({
  portal,
  children,
}: {
  portal: Portal;
  children: ReactNode;
}) {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [screen, setScreen] = useState<Screen>("login");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<CapTrack | null>(null);
  const [activeExam, setActiveExam] = useState<ActiveExam | null>(null);
  const [quizMode, setQuizMode] = useState<ExamMode | null>(null);
  const [pendingPwdUser, setPendingPwdUser] = useState<{
    username: string;
    name: string;
    role?: SessionUser["role"];
    capTrack?: CapTrack;
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

      const applySession = (u: SessionUser) => {
        const home = portalForRole(u.role);
        if (home !== portal) {
          router.replace(PORTAL_PATHS[home]);
          return;
        }
        setUser(u);
        localStorage.setItem(USER_NAME_KEY, u.name);
        localStorage.setItem(USER_ROLE_KEY, u.role);
        if (u.role === "student") {
          const saved = localStorage.getItem(TRACK_KEY);
          const allowed = normalizeCapTrack(u.capTrack);
          if (saved === allowed) {
            setSelectedTrack(allowed);
            setScreen("test-selection");
          } else {
            setSelectedTrack(null);
            setScreen("track-select");
          }
        } else {
          setScreen(screenForRole(u.role));
        }
        setHydrated(true);
      };

      if (username === "root") {
        if (!cancelled) {
          applySession({ username: "root", name: "root", role: "root" });
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
        applySession({
          username,
          name: doc.name || cachedName,
          role,
          capTrack: role === "student" ? normalizeCapTrack(doc.capTrack) : undefined,
        });
      } catch {
        if (cancelled) return;
        const role: SessionUser["role"] =
          cachedRole === "teacher"
            ? "teacher"
            : cachedRole === "root"
              ? "root"
              : "student";
        applySession({ username, name: cachedName, role });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [portal, router]);

  const loginAs = useCallback(
    (u: SessionUser) => {
      const home = portalForRole(u.role);
      setUser(u);
      setPendingPwdUser(null);
      setSelectedTrack(null);
      localStorage.setItem(USER_KEY, u.username);
      localStorage.setItem(USER_NAME_KEY, u.name);
      localStorage.setItem(USER_ROLE_KEY, u.role);
      localStorage.removeItem(TRACK_KEY);
      if (home !== portal) {
        router.replace(PORTAL_PATHS[home]);
        return;
      }
      setScreen(screenForRole(u.role));
    },
    [portal, router]
  );

  const requestSetPassword = useCallback(
    (
      username: string,
      name: string,
      role?: SessionUser["role"],
      capTrack?: CapTrack
    ) => {
      setPendingPwdUser({ username, name, role, capTrack });
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
    setSelectedTrack(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(USER_NAME_KEY);
    localStorage.removeItem(USER_ROLE_KEY);
    localStorage.removeItem(TRACK_KEY);
    setScreen("login");
  }, []);

  const chooseTrack = useCallback(
    (track: CapTrack) => {
      const allowed = normalizeCapTrack(user?.capTrack);
      if (user?.role === "student" && track !== allowed) return;
      setSelectedTrack(track);
      localStorage.setItem(TRACK_KEY, track);
      setScreen("test-selection");
    },
    [user]
  );

  const goToTrackSelect = useCallback(() => {
    setSelectedTrack(null);
    localStorage.removeItem(TRACK_KEY);
    setScreen("track-select");
  }, []);

  const selectTest = useCallback(
    async (test: TestMeta, pausedMode: ExamMode | null) => {
      if (test.placeholder) {
        alert("Este test de viajeros se añadirá pronto.");
        return;
      }
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
      portal,
      screen,
      user,
      selectedTrack,
      activeExam,
      quizMode,
      pendingPwdUser,
      loginAs,
      requestSetPassword,
      logout,
      showLogin,
      chooseTrack,
      goToTrackSelect,
      selectTest,
      startErrorTest,
      chooseMode,
      goToTestSelection,
      goToModeSelect,
      openStats,
    }),
    [
      hydrated,
      portal,
      screen,
      user,
      selectedTrack,
      activeExam,
      quizMode,
      pendingPwdUser,
      loginAs,
      requestSetPassword,
      logout,
      showLogin,
      chooseTrack,
      goToTrackSelect,
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
