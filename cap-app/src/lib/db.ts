import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  CapTrack,
  ExamMode,
  PausedState,
  ScoreRecord,
  TestResultStats,
  UserDoc,
  UserRole,
  WrongQuestionRef,
} from "./types";
import { normalizeCapTrack } from "./types";

/**
 * Firestore data layer. Mirrors the legacy app's data model exactly, so all
 * existing data keeps working:
 *  - users/{username}            { name, password, role, teacherId?, schoolName?, showSeedBtn? }
 *  - paused_tests/{user}_{testId}_{mode}  { userAnswers/hasAnswered as JSON strings, ... }
 *  - test_results/{user}_{testId}         { passes, fails }
 *  - score_records/{autoId}               { user, testId, testName, score, passed, timestamp }
 *  - wrong_questions/{username}           { questions: WrongQuestionRef[], updatedAt }
 */

// ---------- Users ----------

export async function getUserDoc(username: string): Promise<UserDoc | null> {
  const snap = await getDoc(doc(db, "users", username));
  return snap.exists() ? (snap.data() as UserDoc) : null;
}

export async function setUserPassword(
  username: string,
  password: string
): Promise<void> {
  await updateDoc(doc(db, "users", username), { password });
}

export interface CreateUserInput {
  username: string;
  name: string;
  password: string;
  role: UserRole;
  teacherId?: string;
  schoolName?: string;
  capTrack?: CapTrack;
}

/** Returns false if the username already exists. */
export async function createUser(input: CreateUserInput): Promise<boolean> {
  const username = input.username.trim().toLowerCase();
  const ref = doc(db, "users", username);
  const snap = await getDoc(ref);
  if (snap.exists()) return false;

  const data: UserDoc = {
    name: input.name.trim(),
    password: input.password,
    role: input.role,
  };
  if (input.role === "student" && input.teacherId) {
    data.teacherId = input.teacherId;
    data.capTrack = normalizeCapTrack(input.capTrack);
  }
  if (input.role === "teacher" && input.schoolName) {
    data.schoolName = input.schoolName.trim();
  }
  await setDoc(ref, data);
  return true;
}

export interface UserListEntry {
  username: string;
  name: string;
  role: UserRole;
  teacherId?: string;
  schoolName?: string;
  showSeedBtn: boolean;
  capTrack: CapTrack;
}

function toListEntry(id: string, data: UserDoc): UserListEntry {
  return {
    username: id,
    name: data.name,
    role: data.role === "teacher" ? "teacher" : "student",
    teacherId: data.teacherId,
    schoolName: data.schoolName,
    showSeedBtn: data.showSeedBtn === true,
    capTrack: normalizeCapTrack(data.capTrack),
  };
}

/** All non-root users (teachers + students). Prefer role-specific helpers. */
export async function listUsers(): Promise<UserListEntry[]> {
  const snap = await getDocs(collection(db, "users"));
  const users: UserListEntry[] = [];
  snap.forEach((d) => {
    if (d.id === "root") return;
    users.push(toListEntry(d.id, d.data() as UserDoc));
  });
  return users;
}

export async function listTeachers(): Promise<UserListEntry[]> {
  const all = await listUsers();
  return all.filter((u) => u.role === "teacher");
}

export async function listAllStudents(): Promise<UserListEntry[]> {
  const all = await listUsers();
  return all.filter((u) => u.role === "student");
}

export async function listStudentsByTeacher(
  teacherId: string
): Promise<UserListEntry[]> {
  const students = await listAllStudents();
  return students.filter((u) => u.teacherId === teacherId);
}

/** Assign an existing orphan student to a teacher (root only). */
export async function assignStudentToTeacher(
  username: string,
  teacherId: string
): Promise<void> {
  await updateDoc(doc(db, "users", username), { teacherId, role: "student" });
}

export async function deleteUser(username: string): Promise<void> {
  await deleteDoc(doc(db, "users", username));
}

export async function setShowSeedBtn(
  username: string,
  enabled: boolean
): Promise<void> {
  await updateDoc(doc(db, "users", username), { showSeedBtn: enabled });
}

export async function getShowSeedBtn(username: string): Promise<boolean> {
  try {
    const user = await getUserDoc(username);
    return user?.showSeedBtn === true;
  } catch {
    return false;
  }
}

// ---------- Paused tests ----------

export async function savePausedState(
  username: string,
  testId: string,
  mode: ExamMode,
  state: PausedState
): Promise<void> {
  const docId = `${username}_${testId}_${mode}`;
  await setDoc(doc(db, "paused_tests", docId), {
    user: username,
    testId,
    mode,
    currentQuestionIndex: state.currentQuestionIndex,
    userAnswers: JSON.stringify(state.userAnswers),
    hasAnswered: JSON.stringify(state.hasAnswered),
    secondsElapsed: state.secondsElapsed,
  });
}

export async function loadPausedState(
  username: string,
  testId: string,
  mode: ExamMode
): Promise<PausedState | null> {
  const docId = `${username}_${testId}_${mode}`;
  const snap = await getDoc(doc(db, "paused_tests", docId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    currentQuestionIndex: data.currentQuestionIndex || 0,
    secondsElapsed: data.secondsElapsed || 0,
    userAnswers: JSON.parse(data.userAnswers || "{}"),
    hasAnswered: JSON.parse(data.hasAnswered || "{}"),
  };
}

export async function clearPausedState(
  username: string,
  testId: string,
  mode: ExamMode
): Promise<void> {
  const docId = `${username}_${testId}_${mode}`;
  await deleteDoc(doc(db, "paused_tests", docId));
}

/** Map of testId -> paused mode, for the paused indicators on the grid. */
export async function loadPausedMap(
  username: string
): Promise<Map<string, ExamMode>> {
  const map = new Map<string, ExamMode>();
  const snap = await getDocs(
    query(collection(db, "paused_tests"), where("user", "==", username))
  );
  snap.forEach((d) => {
    const data = d.data();
    map.set(data.testId, data.mode as ExamMode);
  });
  return map;
}

// ---------- Results & stats ----------

export async function saveResultStats(
  username: string,
  testId: string,
  testName: string,
  finalScore: number
): Promise<void> {
  const passed = finalScore >= 50;

  // Pass/fail counters per user+test
  const docId = `${username}_${testId}`;
  const ref = doc(db, "test_results", docId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const data = snap.data();
    await updateDoc(ref, {
      passes: passed ? (data.passes || 0) + 1 : data.passes || 0,
      fails: !passed ? (data.fails || 0) + 1 : data.fails || 0,
    });
  } else {
    await setDoc(ref, {
      user: username,
      testId,
      passes: passed ? 1 : 0,
      fails: passed ? 0 : 1,
    });
  }

  // Individual score record for the stats screen
  await addDoc(collection(db, "score_records"), {
    user: username,
    testId,
    testName,
    score: finalScore,
    passed,
    timestamp: serverTimestamp(),
  });
}

export async function loadScoreRecords(
  username: string
): Promise<ScoreRecord[]> {
  const records: ScoreRecord[] = [];
  // No orderBy -> avoids requiring a composite index; sorted client-side
  const snap = await getDocs(
    query(collection(db, "score_records"), where("user", "==", username))
  );
  snap.forEach((d) => {
    const data = d.data();
    records.push({
      testId: data.testId,
      testName: data.testName || data.testId,
      score: data.score,
      passed: data.passed,
      timestamp:
        data.timestamp instanceof Timestamp
          ? data.timestamp.toDate()
          : new Date(0),
    });
  });
  records.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  return records;
}

export async function loadAllResultStats(
  username: string
): Promise<Map<string, TestResultStats>> {
  const map = new Map<string, TestResultStats>();
  const snap = await getDocs(
    query(collection(db, "test_results"), where("user", "==", username))
  );
  snap.forEach((d) => {
    const data = d.data();
    map.set(data.testId, {
      passes: data.passes || 0,
      fails: data.fails || 0,
    });
  });
  return map;
}

// ---------- Test-data seeding (behind showSeedBtn permission) ----------

export async function seedTestData(username: string): Promise<void> {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const mockRecords = [
    { testId: "enero_2024", testName: "Enero 2024", score: 33, passed: false, date: new Date(now - 60 * day) },
    { testId: "enero_2024", testName: "Enero 2024", score: 54, passed: true, date: new Date(now - 50 * day) },
    { testId: "marzo_2024", testName: "Marzo 2024", score: 22, passed: false, date: new Date(now - 48 * day) },
    { testId: "marzo_2024", testName: "Marzo 2024", score: 40, passed: false, date: new Date(now - 40 * day) },
    { testId: "mayo_2024", testName: "Mayo 2024", score: 44, passed: false, date: new Date(now - 38 * day) },
    { testId: "mayo_2024", testName: "Mayo 2024", score: 55, passed: true, date: new Date(now - 30 * day) },
    { testId: "mayo_2024", testName: "Mayo 2024", score: 67, passed: true, date: new Date(now - 22 * day) },
    { testId: "julio_2024", testName: "Julio 2024", score: 88, passed: true, date: new Date(now - 20 * day) },
    { testId: "septiembre_2024", testName: "Septiembre 2024", score: 31, passed: false, date: new Date(now - 18 * day) },
    { testId: "noviembre_2024", testName: "Noviembre 2024", score: 65, passed: true, date: new Date(now - 15 * day) },
    { testId: "noviembre_2024", testName: "Noviembre 2024", score: 72, passed: true, date: new Date(now - 10 * day) },
    { testId: "enero_2025", testName: "Enero 2025", score: 48, passed: false, date: new Date(now - 8 * day) },
    { testId: "marzo_2025", testName: "Marzo 2025", score: 43, passed: false, date: new Date(now - 6 * day) },
    { testId: "marzo_2025", testName: "Marzo 2025", score: 51, passed: true, date: new Date(now - 3 * day) },
    { testId: "mayo_2025", testName: "Mayo 2025", score: 79, passed: true, date: new Date(now - 1 * day) },
  ];

  const batch = writeBatch(db);
  const counters: Record<string, { passes: number; fails: number }> = {};
  for (const r of mockRecords) {
    const ref = doc(collection(db, "score_records"));
    batch.set(ref, {
      user: username,
      testId: r.testId,
      testName: r.testName,
      score: r.score,
      passed: r.passed,
      timestamp: Timestamp.fromDate(r.date),
    });
    if (!counters[r.testId]) counters[r.testId] = { passes: 0, fails: 0 };
    if (r.passed) counters[r.testId].passes++;
    else counters[r.testId].fails++;
  }
  await batch.commit();

  for (const [testId, counts] of Object.entries(counters)) {
    const docId = `${username}_${testId}`;
    const ref = doc(db, "test_results", docId);
    const existing = await getDoc(ref);
    if (existing.exists()) {
      await updateDoc(ref, {
        passes: (existing.data().passes || 0) + counts.passes,
        fails: (existing.data().fails || 0) + counts.fails,
      });
    } else {
      await setDoc(ref, {
        user: username,
        testId,
        passes: counts.passes,
        fails: counts.fails,
      });
    }
  }
}

export async function clearTestData(username: string): Promise<void> {
  const snap = await getDocs(
    query(collection(db, "score_records"), where("user", "==", username))
  );
  const batch = writeBatch(db);
  snap.forEach((d) => batch.delete(d.ref));
  await batch.commit();

  const snap2 = await getDocs(
    query(collection(db, "test_results"), where("user", "==", username))
  );
  const batch2 = writeBatch(db);
  snap2.forEach((d) => batch2.delete(d.ref));
  await batch2.commit();

  await deleteDoc(doc(db, "wrong_questions", username)).catch(() => undefined);
}

// ---------- Wrong-question bank (Test de errores) ----------

function wrongKey(ref: WrongQuestionRef): string {
  return `${ref.testId}::${ref.questionNum}`;
}

export async function loadWrongQuestions(
  username: string
): Promise<WrongQuestionRef[]> {
  const snap = await getDoc(doc(db, "wrong_questions", username));
  if (!snap.exists()) return [];
  const data = snap.data();
  const list = Array.isArray(data.questions) ? data.questions : [];
  return list
    .filter(
      (q): q is WrongQuestionRef =>
        !!q && typeof q.testId === "string" && typeof q.questionNum === "string"
    )
    .map((q) => ({ testId: q.testId, questionNum: q.questionNum }));
}

export async function mergeWrongQuestions(
  username: string,
  incoming: WrongQuestionRef[]
): Promise<void> {
  if (incoming.length === 0) return;
  const existing = await loadWrongQuestions(username);
  const map = new Map(existing.map((q) => [wrongKey(q), q]));
  for (const q of incoming) map.set(wrongKey(q), q);
  await setDoc(doc(db, "wrong_questions", username), {
    user: username,
    questions: Array.from(map.values()),
    updatedAt: serverTimestamp(),
  });
}

export async function removeWrongQuestions(
  username: string,
  toRemove: WrongQuestionRef[]
): Promise<void> {
  if (toRemove.length === 0) return;
  const existing = await loadWrongQuestions(username);
  if (existing.length === 0) return;
  const removeKeys = new Set(toRemove.map(wrongKey));
  const next = existing.filter((q) => !removeKeys.has(wrongKey(q)));
  await setDoc(doc(db, "wrong_questions", username), {
    user: username,
    questions: next,
    updatedAt: serverTimestamp(),
  });
}

export async function countWrongQuestions(username: string): Promise<number> {
  return (await loadWrongQuestions(username)).length;
}
