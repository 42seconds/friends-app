// One-time code rules for demo mode (codes made in the app), matching the
// server version in functions/otp.js: 10 minutes, 5 wrong tries, one email
// a minute, five an hour.
export const CODE_TTL_MS = 10 * 60 * 1000;
export const RESEND_MS = 60 * 1000;
export const MAX_SENDS_PER_HOUR = 5;
export const MAX_ATTEMPTS = 5;
export const ADMIN_TRUST_MS = 12 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

export interface CodeRecord {
  hash: string;
  salt: string;
  expiresAt: number;
  attempts: number;
  sentAt: number;
  sends: number[];
}

function randomInt(max: number): number {
  const c = (globalThis as any).crypto;
  if (c?.getRandomValues) {
    const a = new Uint32Array(1);
    c.getRandomValues(a);
    return a[0] % max;
  }
  return Math.floor(Math.random() * max);
}

export function newCode(): string {
  return String(randomInt(1_000_000)).padStart(6, '0');
}

// Small non-reversible fingerprint (FNV-1a), so the code isn't stored as
// plain text on the phone. Demo mode only; the server uses SHA-256.
export function hashCode(code: string, salt: string): string {
  let h = 0x811c9dc5;
  for (const ch of `${salt}:${code}`) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16);
}

export function newRecord(code: string, now: number, previous?: CodeRecord | null): CodeRecord {
  const salt = `${now}-${randomInt(1e9)}`;
  const sends = [...(previous?.sends ?? []).filter((t) => now - t < HOUR), now];
  return { hash: hashCode(code, salt), salt, expiresAt: now + CODE_TTL_MS, attempts: 0, sentAt: now, sends };
}

export function sendBlocked(previous: CodeRecord | null | undefined, now: number): { reason: 'wait' | 'hourly'; retryInSeconds: number } | null {
  if (!previous) return null;
  if (now - previous.sentAt < RESEND_MS) return { reason: 'wait', retryInSeconds: Math.ceil((RESEND_MS - (now - previous.sentAt)) / 1000) };
  const recent = (previous.sends ?? []).filter((t) => now - t < HOUR);
  if (recent.length >= MAX_SENDS_PER_HOUR) return { reason: 'hourly', retryInSeconds: Math.ceil((Math.min(...recent) + HOUR - now) / 1000) };
  return null;
}

export type CheckResult = { ok: true } | { ok: false; reason: 'missing' | 'expired' | 'locked' | 'format' | 'wrong'; attemptsLeft?: number };

export function checkCode(record: CodeRecord | null | undefined, code: string, now: number): CheckResult {
  if (!record) return { ok: false, reason: 'missing' };
  if (now > record.expiresAt) return { ok: false, reason: 'expired' };
  if (record.attempts >= MAX_ATTEMPTS) return { ok: false, reason: 'locked' };
  const typed = String(code ?? '').replace(/\D/g, '');
  if (typed.length !== 6) return { ok: false, reason: 'format', attemptsLeft: MAX_ATTEMPTS - record.attempts };
  if (hashCode(typed, record.salt) === record.hash) return { ok: true };
  return { ok: false, reason: 'wrong', attemptsLeft: MAX_ATTEMPTS - record.attempts - 1 };
}

export function checkMessage(r: Exclude<CheckResult, { ok: true }>): string {
  switch (r.reason) {
    case 'missing':
      return 'That code has expired or was already used. Ask for a new one.';
    case 'expired':
      return 'That code has expired. Ask for a new one.';
    case 'locked':
      return 'Too many wrong tries. Ask for a new code.';
    case 'format':
      return 'Enter the 6-digit code from the email.';
    default:
      return (r.attemptsLeft ?? 0) > 0 ? `That code isn't right. ${r.attemptsLeft} ${r.attemptsLeft === 1 ? 'try' : 'tries'} left.` : 'Too many wrong tries. Ask for a new code.';
  }
}
