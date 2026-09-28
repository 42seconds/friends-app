// Event dates are stored as free-form strings by the admin website, so
// parsing is best-effort. Anything unparseable is treated as upcoming.

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export function parseEventDate(date?: string, time?: string): Date | null {
  if (!date) return null;
  const withTime = time ? `${date} ${time}` : date;
  let ms = Date.parse(withTime);
  if (Number.isNaN(ms)) ms = Date.parse(date);
  return Number.isNaN(ms) ? null : new Date(ms);
}

export function dateParts(date?: string, time?: string) {
  const d = parseEventDate(date, time);
  if (!d) return null;
  return {
    day: DAYS[d.getDay()],
    date: String(d.getDate()).padStart(2, '0'),
    month: MONTHS[d.getMonth()],
    monthYear: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
  };
}

// "Fri 12 Jun" — falls back to the raw string.
export function shortDate(date?: string, time?: string): string {
  const p = dateParts(date, time);
  if (!p) return date ?? '';
  const cap = (s: string) => s[0] + s.slice(1).toLowerCase();
  return `${cap(p.day)} ${Number(p.date)} ${cap(p.month)}`;
}

export function isPast(date?: string, time?: string): boolean {
  const d = parseEventDate(date, time);
  if (!d) return false;
  // An event counts as past the day after it happens.
  return d.getTime() + 24 * 3600 * 1000 < Date.now();
}

// "In 2 days", "Tonight", "Tomorrow" — or null when unknown / past.
export function relativeDay(date?: string, time?: string): string | null {
  const d = parseEventDate(date, time);
  if (!d) return null;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const days = Math.round((target.getTime() - start.getTime()) / 86400000);
  if (days < 0) return null;
  if (days === 0) return 'Tonight';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
}

export function clock(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// "Thu 11 Jun, 14:05"
export function stamp(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const cap = (s: string) => s[0] + s.slice(1).toLowerCase();
  return `${cap(DAYS[d.getDay()])} ${d.getDate()} ${cap(MONTHS[d.getMonth()])}, ${clock(iso)}`;
}

// "3h 10m", "12m", "now"
export function ago(iso?: string): string {
  if (!iso) return '';
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ${mins % 60}m`;
  return `${Math.floor(h / 24)}d`;
}

// "23:41:10" countdown to a target time; "00:00:00" once passed.
export function countdown(targetMs: number, now = Date.now()): string {
  const s = Math.max(0, Math.floor((targetMs - now) / 1000));
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}
