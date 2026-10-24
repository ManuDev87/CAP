import { currentIdToken } from "./authSession";

const FUNCTIONS_BASE =
  process.env.NEXT_PUBLIC_FUNCTIONS_URL ??
  "https://europe-west1-grupo-cap.cloudfunctions.net";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const token = await currentIdToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${FUNCTIONS_BASE}/${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  let data: { error?: string } & T;
  try {
    data = (await res.json()) as { error?: string } & T;
  } catch {
    throw new ApiError("Error de conexión", res.status);
  }
  if (!res.ok) {
    throw new ApiError(data.error || "No se pudo completar la petición", res.status);
  }
  return data;
}

export type ApiUser = {
  username: string;
  name: string;
  role: "student" | "teacher" | "root";
  teacherId: string | null;
  schoolCode: string | null;
  schoolName: string | null;
  capTrack: "mercancias" | "viajeros";
  billing: "school" | "prepaid" | null;
  paidUntil: number | null;
  trialEndsAt: number | null;
};

export function loginRemote(username: string, password: string) {
  return post<{ token: string; user: ApiUser; mustSetPassword?: boolean }>(
    "login",
    { username, password }
  );
}

export function registerTeacherRemote(input: {
  username: string;
  password: string;
  name: string;
  schoolName: string;
}) {
  return post<{ token: string; user: ApiUser; inviteUrl: string }>(
    "registerTeacher",
    input
  );
}

export function registerStudentRemote(input: {
  username: string;
  password: string;
  name: string;
  schoolCode: string;
  capTrack: "mercancias" | "viajeros";
}) {
  return post<{ token: string; user: ApiUser; needsPayment: boolean }>(
    "registerStudent",
    input
  );
}

export function addStudentByTeacherRemote(input: {
  teacherUsername: string;
  username: string;
  name: string;
  password: string;
  capTrack: "mercancias" | "viajeros";
}) {
  return post<{ user: ApiUser; seatsLeft: number }>("addStudentByTeacher", input);
}

export function createCheckoutRemote(username: string, months: number) {
  return post<{ url: string; months: number; amountCents: number }>(
    "createCheckoutSession",
    { username, months }
  );
}

export function createSchoolPackRemote(username: string, seats: number, months: number) {
  return post<{ url: string; seats: number; months: number; amountCents: number }>(
    "createSchoolPackCheckout",
    { username, seats, months }
  );
}

export function connectOnboardRemote(username: string) {
  return post<{ url: string; accountId: string }>("connectOnboard", { username });
}

export type CenterInfo = {
  schoolCode: string;
  schoolName: string;
  seatsPurchased: number;
  seatsUsed: number;
  seatsLeft: number;
  packPaidUntil: number | null;
  packActive: boolean;
  inviteUrl: string;
};

export function ensureCenterRemote(username: string) {
  return post<CenterInfo>("ensureCenter", {
    username,
  });
}

export function staffRemote<T = { ok: true }>(
  action: string,
  body: Record<string, unknown> = {}
) {
  return post<T>("staff", { action, ...body });
}

export type RemoteScoreRecord = {
  testId: string;
  testName: string;
  score: number;
  passed: boolean;
  timestamp: number;
};

export function studentScoresRemote(username: string) {
  return staffRemote<{ records: RemoteScoreRecord[] }>("studentScores", {
    username,
  });
}
