export interface ExamOption {
  id: string;
  text: string;
}

export interface Question {
  num: string;
  question: string;
  options: ExamOption[];
  correct: string;
  /** Only present in a few legacy exams (e.g. marzo_2024). */
  reference?: string;
  /** Origin exam when the question belongs to the error bank. */
  sourceTestId?: string;
}

export type HelpOrigin = "catalog" | "official-ref" | "plantilla" | "temario";

/** Explanation shown by the quiz Ayuda button. */
export interface QuestionHelp {
  explanation: string;
  source?: string;
  sourceUrl?: string;
  origin: HelpOrigin;
  correctText: string;
  /** True when the text is tied to a curated official citation. */
  verified: boolean;
}

export type ExamMode = "examen" | "ayuda";

export type CapTrack = "mercancias" | "viajeros";

export const CAP_TRACK_LABELS: Record<CapTrack, string> = {
  mercancias: "Mercancías",
  viajeros: "Viajeros",
};

export function normalizeCapTrack(value: unknown): CapTrack {
  return value === "viajeros" ? "viajeros" : "mercancias";
}

export interface TestMeta {
  id: string;
  name: string;
  img: string;
  /** Visual-only card until the exam JSON is ingested. */
  placeholder?: boolean;
}

export interface CommunitySubregion {
  id: string;
  name: string;
  tests: TestMeta[];
}

export interface CommunityRegion {
  id: string;
  name: string;
  tests: TestMeta[];
  /** Si existe, al pulsar la CCAA se elige primero la provincia/territorio. */
  subregions?: CommunitySubregion[];
}

export type UserRole = "student" | "teacher";

export interface SessionUser {
  username: string;
  name: string;
  role: "root" | UserRole;
  /** Students only. Missing/legacy accounts count as mercancías. */
  capTrack?: CapTrack;
}

/** Answer maps are keyed by question index (as in the legacy app). */
export type AnswerMap = Record<number, string>;
export type AnsweredMap = Record<number, boolean>;

export interface PausedState {
  currentQuestionIndex: number;
  userAnswers: AnswerMap;
  hasAnswered: AnsweredMap;
  secondsElapsed: number;
}

export interface ScoreRecord {
  testId: string;
  testName: string;
  score: number;
  passed: boolean;
  timestamp: Date;
}

export interface TestResultStats {
  passes: number;
  fails: number;
}

export interface ScoreBreakdown {
  correct: number;
  wrong: number;
  blank: number;
  bonusCorrect: number;
  finalScore: number;
}

/** Stable reference to a missed question across exams. */
export interface WrongQuestionRef {
  testId: string;
  questionNum: string;
}

export const ERRORS_EXAM_ID = "errores";

export interface UserDoc {
  name: string;
  password?: string;
  role?: UserRole;
  /** Student only: username of the owning teacher (autoescuela). */
  teacherId?: string;
  /** Teacher only: driving-school / class label. */
  schoolName?: string;
  /** Teacher only: when the autoescuela trial ends (Firestore Timestamp or epoch ms). */
  trialEndsAt?: unknown;
  showSeedBtn?: boolean;
  /** Student only: CAP mercancías or viajeros. Legacy docs without it are mercancías. */
  capTrack?: CapTrack;
}
