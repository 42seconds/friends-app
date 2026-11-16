import Constants from 'expo-constants';

// Email codes (6-digit one-time codes). Set "emailCodes" in app.json
// (expo.extra) to one of:
//
//   "off"       Firebase's free email links to confirm emails and reset
//               passwords; admins log in with their password only.
//   "emailjs"   Demo mode, no server: codes are made in the app and emailed
//               through EmailJS's free plan (fill in expo.extra.emailjs, see
//               docs/otp-codes.md). Used to confirm emails and for admin
//               2-step. Forgot password stays a Firebase link (only a server
//               can change a password with a code). Not secure against
//               someone who modifies the app: it's for demos.
//   "firebase"  The secure version: the Cloud Functions in functions/
//               (needs Firebase's Blaze plan). Also does forgot password.
//   "https://…" The same functions hosted somewhere else.
const extra = (Constants.expoConfig?.extra ?? {}) as { emailCodes?: string; emailjs?: { serviceId?: string; templateId?: string; bookingTemplateId?: string; publicKey?: string } };
const setting = String(extra.emailCodes ?? 'off').trim();

export const EMAILJS = {
  serviceId: extra.emailjs?.serviceId?.trim() ?? '',
  templateId: extra.emailjs?.templateId?.trim() ?? '',
  // Second template: the booking emails (held / you're in / needs a fix).
  // Empty = no booking emails.
  bookingTemplateId: extra.emailjs?.bookingTemplateId?.trim() ?? '',
  publicKey: extra.emailjs?.publicKey?.trim() ?? '',
};
const emailjsReady = !!(EMAILJS.serviceId && EMAILJS.templateId && EMAILJS.publicKey);

export type EmailCodesMode = 'off' | 'emailjs' | 'server';

// EmailJS mode without its keys filled in falls back to "off".
export const EMAIL_CODES_MODE: EmailCodesMode =
  setting === 'emailjs' ? (emailjsReady ? 'emailjs' : 'off') : setting === '' || setting === 'off' ? 'off' : 'server';

export const EMAIL_CODES_ON = EMAIL_CODES_MODE !== 'off';
// Forgot password by code needs the server.
export const RESET_BY_CODE = EMAIL_CODES_MODE === 'server';
export const EMAIL_CODES_URL = EMAIL_CODES_MODE === 'server' && /^https?:\/\//.test(setting) ? setting.replace(/\/+$/, '') : null;
