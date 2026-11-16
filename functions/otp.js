// One-time codes: the rules, kept apart from Firebase so they can be tested.
const crypto = require('node:crypto');

const PURPOSES = ['verify-email', 'admin-login', 'reset-password'];
const CODE_TTL_MS = 10 * 60 * 1000; // a code works for 10 minutes
const RESEND_MS = 60 * 1000; // at most one email a minute
const MAX_SENDS_PER_HOUR = 5;
const MAX_ATTEMPTS = 5; // wrong guesses before the code stops working
const ADMIN_TRUST_MS = 12 * 60 * 60 * 1000; // admin 2-step lasts 12 hours on a device

function newCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

function hashCode(code, salt) {
  return crypto.createHash('sha256').update(`${salt}:${code}`).digest('hex');
}

// The record saved for a freshly sent code. Only a salted hash of the
// code is stored, never the code itself.
function newRecord(code, now, previous) {
  const salt = crypto.randomBytes(16).toString('hex');
  const sends = [...(previous?.sends ?? []).filter((t) => now - t < 60 * 60 * 1000), now];
  return { hash: hashCode(code, salt), salt, expiresAt: now + CODE_TTL_MS, attempts: 0, sentAt: now, sends };
}

// Why a new code can't be sent yet, or null.
// Returns { reason, retryInSeconds }.
function sendBlocked(previous, now) {
  if (!previous) return null;
  if (now - previous.sentAt < RESEND_MS) {
    return { reason: 'wait', retryInSeconds: Math.ceil((RESEND_MS - (now - previous.sentAt)) / 1000) };
  }
  const recent = (previous.sends ?? []).filter((t) => now - t < 60 * 60 * 1000);
  if (recent.length >= MAX_SENDS_PER_HOUR) {
    const oldest = Math.min(...recent);
    return { reason: 'hourly', retryInSeconds: Math.ceil((oldest + 60 * 60 * 1000 - now) / 1000) };
  }
  return null;
}

// Checks a typed code against the saved record.
// Returns { ok: true } or { ok: false, reason, attemptsLeft }.
function checkCode(record, code, now) {
  if (!record) return { ok: false, reason: 'missing' };
  if (now > record.expiresAt) return { ok: false, reason: 'expired' };
  if (record.attempts >= MAX_ATTEMPTS) return { ok: false, reason: 'locked' };
  const typed = String(code ?? '').replace(/\D/g, '');
  if (typed.length !== 6) return { ok: false, reason: 'format', attemptsLeft: MAX_ATTEMPTS - record.attempts };
  const a = Buffer.from(hashCode(typed, record.salt), 'hex');
  const b = Buffer.from(record.hash, 'hex');
  if (a.length === b.length && crypto.timingSafeEqual(a, b)) return { ok: true };
  return { ok: false, reason: 'wrong', attemptsLeft: MAX_ATTEMPTS - record.attempts - 1 };
}

// New passwords set with a reset code follow the app's rules
// (src/lib/validation.ts PASSWORD_RULES).
function passwordProblem(pw) {
  if (typeof pw !== 'string' || !pw) return 'Choose a password.';
  if (pw.length > 128) return 'That password is too long.';
  if (pw.length < 8) return 'Use at least 8 characters.';
  if (!/[A-Z]/.test(pw)) return 'Add an uppercase letter (A–Z).';
  if (!/[a-z]/.test(pw)) return 'Add a lowercase letter (a–z).';
  if (!/\d/.test(pw)) return 'Add a number (0–9).';
  if (!/[^A-Za-z0-9\s]/.test(pw)) return 'Add a symbol, like ! @ # ? or *.';
  if (/\s/.test(pw)) return 'Take out the spaces.';
  return null;
}

function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase();
}

const SUBJECTS = {
  'verify-email': 'Your &FRIENDS code to confirm your email',
  'admin-login': 'Your &FRIENDS staff login code',
  'reset-password': 'Your &FRIENDS password reset code',
};

const LINES = {
  'verify-email': 'Enter this code in the &friends app to confirm your email.',
  'admin-login': 'Someone (hopefully you) logged in to a staff account. Enter this code in the &friends app to finish logging in.',
  'reset-password': 'Enter this code in the &friends app to choose a new password.',
};

function emailContent(purpose, code) {
  const spaced = `${code.slice(0, 3)} ${code.slice(3)}`;
  const line = LINES[purpose];
  const text = `${line}\n\nYour code: ${spaced}\n\nIt works for 10 minutes. If you didn't ask for this, you can ignore this email; your account is safe.\n\n&FRIENDS, Braamfontein`;
  const html = `<!doctype html><html><body style="margin:0;background:#F3F0E8;font-family:Helvetica,Arial,sans-serif;color:#15130F">
<div style="max-width:480px;margin:0 auto;padding:32px 24px">
<div style="font-size:22px;font-weight:800;letter-spacing:1px">&amp;FRIENDS</div>
<p style="font-size:16px;line-height:1.5;margin:24px 0 16px">${line.replace(/&/g, '&amp;')}</p>
<div style="background:#15130F;color:#F3F0E8;border-radius:16px;padding:20px;text-align:center;font-family:Menlo,Consolas,monospace;font-size:36px;font-weight:700;letter-spacing:8px">${spaced}</div>
<p style="font-size:14px;line-height:1.5;color:#5E594F;margin:16px 0 0">It works for 10 minutes. If you didn't ask for this, you can ignore this email; your account is safe.</p>
</div></body></html>`;
  return { subject: SUBJECTS[purpose], text, html };
}

module.exports = {
  PURPOSES,
  CODE_TTL_MS,
  RESEND_MS,
  MAX_SENDS_PER_HOUR,
  MAX_ATTEMPTS,
  ADMIN_TRUST_MS,
  newCode,
  hashCode,
  newRecord,
  sendBlocked,
  checkCode,
  passwordProblem,
  normalizeEmail,
  emailContent,
};
