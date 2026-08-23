export const TRIAL_MONTH_OPTIONS = [1, 2, 3, 4, 5, 6] as const;

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addTrialMonths(from: Date, months: number): Date {
  const next = startOfLocalDay(from);
  next.setMonth(next.getMonth() + months);
  return next;
}

/** Whole calendar days left until the trial end date. Negative if expired. */
export function remainingTrialDays(endsAt: Date | number | string): number {
  const end = startOfLocalDay(new Date(endsAt));
  const today = startOfLocalDay(new Date());
  return Math.round((end.getTime() - today.getTime()) / 86_400_000);
}

export function formatTrialLabel(days: number): string {
  if (days < 0) return "Prueba caducada";
  if (days === 0) return "Último día de prueba";
  if (days === 1) return "Queda 1 día";
  return `Quedan ${days} días`;
}

export function trialTone(
  days: number
): "is-ok" | "is-warn" | "is-expired" {
  if (days < 0) return "is-expired";
  if (days <= 14) return "is-warn";
  return "is-ok";
}
