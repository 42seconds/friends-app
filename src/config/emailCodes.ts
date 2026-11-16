import Constants from 'expo-constants';

// Email codes (6-digit OTP) need a small server to make, email and check
// them (see docs/otp-codes.md). Set "emailCodes" in app.json (extra) to:
//   "off"                  no code server: Firebase's free email links are
//                          used to confirm emails and reset passwords, and
//                          admins log in with their password only
//   "firebase"             the Cloud Functions in functions/ (Blaze plan)
//   "https://…/api"        the same functions hosted elsewhere for free
//                          (e.g. Vercel, see server/)
const setting = String(Constants.expoConfig?.extra?.emailCodes ?? 'off').trim();

export const EMAIL_CODES_ON = setting !== '' && setting !== 'off';
export const EMAIL_CODES_URL = /^https?:\/\//.test(setting) ? setting.replace(/\/+$/, '') : null;
