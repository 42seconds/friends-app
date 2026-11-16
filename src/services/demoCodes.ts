import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';
import { EMAILJS } from '../config/emailCodes';
import { ADMIN_TRUST_MS, CodeRecord, checkCode, checkMessage, newCode, newRecord, RESEND_MS, sendBlocked } from '../lib/codeRules';

// Demo mode for email codes (emailCodes: "emailjs" in app.json): no server.
// The code is made on the phone, emailed through EmailJS's free plan, and
// checked on the phone. It looks and works like real one-time codes, but
// someone who modifies the app could get around it; the secure version is
// the Cloud Functions in functions/ (see docs/otp-codes.md).
type Purpose = 'verify-email' | 'admin-login';

const key = (purpose: Purpose, uid: string) => `demoCode:${purpose}:${uid}`;

// Errors shaped like the server's, so the screens treat both the same.
function fail(code: string, message: string, details?: Record<string, unknown>) {
  return Object.assign(new Error(message), { code: `functions/${code}`, details });
}

const SUBJECTS: Record<Purpose, string> = {
  'verify-email': 'Your &FRIENDS code to confirm your email',
  'admin-login': 'Your &FRIENDS staff login code',
};
const LINES: Record<Purpose, string> = {
  'verify-email': 'Enter this code in the &friends app to confirm your email.',
  'admin-login': 'Someone (hopefully you) logged in to a staff account. Enter this code in the &friends app to finish logging in.',
};

async function read(purpose: Purpose, uid: string): Promise<CodeRecord | null> {
  try {
    const raw = await AsyncStorage.getItem(key(purpose, uid));
    return raw ? (JSON.parse(raw) as CodeRecord) : null;
  } catch {
    return null;
  }
}

const write = (purpose: Purpose, uid: string, rec: CodeRecord | null) =>
  (rec ? AsyncStorage.setItem(key(purpose, uid), JSON.stringify(rec)) : AsyncStorage.removeItem(key(purpose, uid))).catch(() => {});

async function emailCode(to: string, purpose: Purpose, code: string) {
  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: EMAILJS.serviceId,
      template_id: EMAILJS.templateId,
      user_id: EMAILJS.publicKey,
      template_params: {
        to_email: to,
        subject: SUBJECTS[purpose],
        message: LINES[purpose],
        code: `${code.slice(0, 3)} ${code.slice(3)}`,
      },
    }),
  }).catch(() => null);
  if (!res) throw fail('unavailable', "You're offline. Connect to the internet and try again.");
  if (!res.ok) {
    const why = await res.text().catch(() => '');
    console.warn('EmailJS refused the email:', res.status, why);
    throw fail('unavailable', "We couldn't send the email. Please try again in a minute.");
  }
}

export async function sendDemoCode(purpose: Purpose): Promise<{ sent: boolean; resendIn: number }> {
  const u = auth.currentUser;
  if (!u?.email) throw fail('unauthenticated', 'Please log in first.');
  const now = Date.now();
  const prev = await read(purpose, u.uid);
  const blocked = sendBlocked(prev, now);
  if (blocked) {
    throw fail('resource-exhausted', blocked.reason === 'wait' ? `Wait ${blocked.retryInSeconds}s before asking for another code.` : 'Too many codes sent. Try again later.', { retryIn: blocked.retryInSeconds });
  }
  const code = newCode();
  const rec = newRecord(code, now, prev);
  await emailCode(u.email, purpose, code);
  await write(purpose, u.uid, rec);
  return { sent: true, resendIn: RESEND_MS / 1000 };
}

export async function verifyDemoCode(purpose: Purpose, code: string): Promise<{ verified: boolean; until?: number }> {
  const u = auth.currentUser;
  if (!u) throw fail('unauthenticated', 'Please log in first.');
  const now = Date.now();
  const rec = await read(purpose, u.uid);
  const r = checkCode(rec, code, now);
  if (!r.ok) {
    if (r.reason === 'expired' || r.reason === 'locked') await write(purpose, u.uid, null);
    else if (r.reason === 'wrong' && rec) await write(purpose, u.uid, { ...rec, attempts: rec.attempts + 1 });
    throw fail(r.reason === 'format' || r.reason === 'wrong' ? 'invalid-argument' : 'failed-precondition', checkMessage(r), { reason: r.reason, attemptsLeft: r.attemptsLeft });
  }
  await write(purpose, u.uid, null);
  if (purpose === 'verify-email') {
    // Firebase's own "email verified" flag can only be set by a server, so
    // the confirmation is kept on the profile (the app reads either).
    await updateDoc(doc(db, 'users', u.uid), { emailConfirmed: true, emailConfirmedAt: new Date(now).toISOString() });
    return { verified: true };
  }
  return { verified: true, until: now + ADMIN_TRUST_MS };
}
