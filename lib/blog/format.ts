// Blog PR 2 — pure date presentation for the ISO `date` field (YYYY-MM-DD).
//
// Parsed BY PARTS, never `new Date(iso)`: `new Date("2026-07-24")` is UTC midnight and
// toLocale* would shift it a day in western timezones. Splitting the string keeps the
// authored day exactly. Dependency-free, so it is unit-exercisable and safe in any
// component. A non-ISO or empty value returns as-is rather than throwing.

const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function parts(iso: string): { y: string; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return null;
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return { y: match[1], m, d };
}

/** "24 July 2026" — the masthead / article header form. */
export function formatLongDate(iso: string): string {
  const p = parts(iso);
  return p ? `${p.d} ${MONTHS_LONG[p.m - 1]} ${p.y}` : iso;
}

/** "24 Jul 2026" — the stream-card form. */
export function formatShortDate(iso: string): string {
  const p = parts(iso);
  return p ? `${p.d} ${MONTHS_SHORT[p.m - 1]} ${p.y}` : iso;
}

/** "24 Jul" — the docked-capsule form (no year, tight). */
export function formatCapsuleDate(iso: string): string {
  const p = parts(iso);
  return p ? `${p.d} ${MONTHS_SHORT[p.m - 1]}` : iso;
}
