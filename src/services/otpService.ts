import { httpsCallable, httpsCallableFromURL } from 'firebase/functions';
import { functions } from '../firebase/firebaseConfig';
import { EMAIL_CODES_URL } from '../config/emailCodes';

// One-time 6-digit codes sent by email. The codes are made, emailed and
// checked by the Cloud Functions in functions/index.js; the app only asks
// for one and passes on what the person typed.
export type CodePurpose = 'verify-email' | 'admin-login' | 'reset-password';

type SendResult = { sent: boolean; resendIn: number };
type VerifyResult = { verified: boolean; until?: number };

// Firebase Cloud Functions by name, or the same functions hosted elsewhere
// (EMAIL_CODES_URL, see src/config/emailCodes.ts).
const callable = <I, O>(name: string) => (EMAIL_CODES_URL ? httpsCallableFromURL<I, O>(functions, `${EMAIL_CODES_URL}/${name}`) : httpsCallable<I, O>(functions, name));
const sendFn = callable<{ purpose: CodePurpose; email?: string }, SendResult>('sendCode');
const verifyFn = callable<{ purpose: CodePurpose; code: string; email?: string; newPassword?: string }, VerifyResult>('verifyCode');

export async function sendCode(purpose: CodePurpose, email?: string): Promise<SendResult> {
  return (await sendFn({ purpose, email })).data;
}

export async function verifyCode(purpose: CodePurpose, code: string, extra: { email?: string; newPassword?: string } = {}): Promise<VerifyResult> {
  return (await verifyFn({ purpose, code: code.replace(/\D/g, ''), ...extra })).data;
}

// Seconds to wait before another code can be sent, when the server said
// "too soon"; null for any other error.
export function retryIn(err: any): number | null {
  const s = err?.details?.retryIn;
  return typeof s === 'number' && s > 0 ? s : null;
}

// Messages for the code screens. The server's own messages are already
// written for people, so they're shown as they are.
export function codeErrorMessage(err: any): string {
  const code: string = err?.code ?? '';
  const msg: string = err?.message ?? '';
  if (code.includes('offline') || code === 'auth/network-request-failed') return "You're offline. Connect to the internet and try again.";
  // The functions haven't been deployed (or a typo in their name).
  if (code === 'functions/not-found' && /^not[ _-]?found$/i.test(msg)) return "Email codes aren't switched on yet. Ask the &FRIENDS team.";
  if (code === 'functions/unavailable' && !msg) return "You're offline. Connect to the internet and try again.";
  if (code === 'functions/deadline-exceeded') return 'That took too long. Check your connection and try again.';
  if (code === 'functions/internal' || !code.startsWith('functions/') || !msg) return 'Something went wrong. Please try again.';
  return msg;
}
