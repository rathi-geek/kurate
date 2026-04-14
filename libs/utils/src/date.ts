/**
 * "April 10" — locale-aware month + day label.
 */
export function formatDateLabel(date: Date = new Date()): string {
  return date.toLocaleDateString(undefined, { month: "long", day: "numeric" });
}

/**
 * Returns midnight (00:00:00.000) of the given date's day.
 */
export function startOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Subtracts `days` from the given date.
 */
export function subDays(date: Date, days: number): Date {
  return new Date(date.getTime() - days * 86_400_000);
}
