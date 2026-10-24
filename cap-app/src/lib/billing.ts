import { Timestamp } from "firebase/firestore";
import { remainingTrialDays } from "./trial";

export const PAID_MONTH_OPTIONS = [1, 2, 3, 6, 12] as const;
export const PAID_SEAT_OPTIONS = [12, 25, 50] as const;
export const EURO_PER_MONTH = 5;
export const SCHOOL_SEAT_EURO_PER_MONTH = 4;
export const MIN_PAID_MONTHS = 1;
export const MAX_PAID_MONTHS = 12;
export const MIN_PAID_SEATS = 1;
export const MAX_PAID_SEATS = 200;

export type BillingKind = "school" | "prepaid";

export function parsePaidUntil(value: unknown): number | undefined {
  if (value == null) return undefined;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === "object" && value !== null && "seconds" in value) {
    const seconds = Number((value as { seconds: unknown }).seconds);
    if (Number.isFinite(seconds)) return seconds * 1000;
  }
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

/** Prepaid and school-seat students need a future paidUntil. Legacy (no billing) keeps access. */
export function studentNeedsPaywall(input: {
  role?: string;
  billing?: BillingKind | string | null;
  paidUntil?: unknown;
}): boolean {
  if (input.role === "teacher" || input.role === "root") return false;
  if (input.billing !== "prepaid" && input.billing !== "school") return false;
  return !hasPaidAccess(input.paidUntil);
}

export function hasPaidAccess(paidUntil: unknown): boolean {
  const ms = parsePaidUntil(paidUntil);
  if (ms == null) return false;
  return ms > Date.now();
}

export function monthsTotal(months: number): number {
  return EURO_PER_MONTH * months;
}

export function packTotal(seats: number, months: number): number {
  return SCHOOL_SEAT_EURO_PER_MONTH * seats * months;
}

export type SchoolPayStatus = "pack" | "trial" | "unpaid";

export function schoolPayStatus(input: {
  trialEndsAt?: number | null;
  packPaidUntil?: number | null;
}): SchoolPayStatus {
  if (input.packPaidUntil != null && input.packPaidUntil > Date.now()) {
    return "pack";
  }
  if (input.trialEndsAt != null && remainingTrialDays(input.trialEndsAt) >= 0) {
    return "trial";
  }
  return "unpaid";
}

export const SCHOOL_PAY_LABELS: Record<SchoolPayStatus, string> = {
  pack: "Pack pagado",
  trial: "Prueba",
  unpaid: "Sin pago",
};

/** Trial is running and there is no paid pack: lock license / student-pay actions. */
export function isActiveSchoolTrial(input: {
  trialEndsAt?: number | null;
  packPaidUntil?: number | null;
}): boolean {
  return schoolPayStatus(input) === "trial";
}

export function studentPayLabel(input: {
  billing?: BillingKind | string | null;
  paidUntil?: unknown;
}): string {
  if (hasPaidAccess(input.paidUntil)) {
    return input.billing === "school" ? "Plaza de pack" : "Pagado";
  }
  if (input.billing === "prepaid") return "Pendiente de pago";
  if (input.billing === "school") return "Pack vencido";
  return "Sin cobro";
}

export function formatPaidUntil(paidUntil: unknown): string {
  const ms = parsePaidUntil(paidUntil);
  if (ms == null) return "";
  return new Date(ms).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
