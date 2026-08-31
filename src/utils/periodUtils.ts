/**
 * Date helpers for financial periods.
 *
 * CRITICAL: transaction dates are stored as plain `YYYY-MM-DD` (no time, no
 * timezone). `new Date('2026-02-01')` parses as **UTC midnight**, which in
 * Brazil (UTC-3) becomes 31/01 21:00 — so `getMonth()` returns January and the
 * transaction is counted in the wrong month. Every date comparison in the app
 * must go through these helpers.
 */

/** Parse a `YYYY-MM-DD` string as a LOCAL date (no timezone shift). */
export function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** Format a Date as `YYYY-MM-DD` using local fields (never toISOString). */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

/** `2026-02-14` → `2026-02` */
export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

/** Year of a `YYYY-MM-DD` string. */
export function yearOf(iso: string): number {
  return Number(iso.slice(0, 4));
}

/** Month index (0-11) of a `YYYY-MM-DD` string. */
export function monthOf(iso: string): number {
  return Number(iso.slice(5, 7)) - 1;
}

/** Day of month of a `YYYY-MM-DD` string. */
export function dayOf(iso: string): number {
  return Number(iso.slice(8, 10));
}

export function isInMonth(iso: string, year: number, month: number): boolean {
  return yearOf(iso) === year && monthOf(iso) === month;
}

export function isInYear(iso: string, year: number): boolean {
  return yearOf(iso) === year;
}

/** Inclusive range check on `YYYY-MM-DD` strings (lexicographic = chronological). */
export function isInRange(iso: string, from: string, to: string): boolean {
  const d = iso.slice(0, 10);
  return d >= from && d <= to;
}

/** Month bounds as `YYYY-MM-DD`, timezone-safe. */
export function monthBoundsISO(year: number, month: number): { from: string; to: string } {
  return {
    from: toISODate(new Date(year, month, 1)),
    to: toISODate(new Date(year, month + 1, 0)),
  };
}

export function yearBoundsISO(year: number): { from: string; to: string } {
  return { from: `${year}-01-01`, to: `${year}-12-31` };
}

/** Day before an ISO date (used for opening balances). */
export function previousDayISO(iso: string): string {
  const d = parseLocalDate(iso);
  d.setDate(d.getDate() - 1);
  return toISODate(d);
}

export function addMonthsISO(iso: string, months: number): string {
  const d = parseLocalDate(iso);
  d.setMonth(d.getMonth() + months);
  return toISODate(d);
}

/** pt-BR short date, timezone-safe. */
export function formatDateBR(iso: string): string {
  return parseLocalDate(iso).toLocaleDateString('pt-BR');
}
