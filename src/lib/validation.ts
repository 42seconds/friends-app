// Form checks shared by every screen. Each returns an error message to
// show under the field, or null when the value is fine.

export const LIMITS = {
  name: 50,
  email: 254,
  password: 128,
  phone: 16,
  shortText: 80,
  longText: 1000,
};

type Check = string | null;

export function checkName(v: string, label = 'name', required = true): Check {
  const s = v.trim();
  if (!s) return required ? `Add your ${label}` : null;
  if (s.length < 2) return `Your ${label} looks too short`;
  if (s.length > LIMITS.name) return `Keep your ${label} under ${LIMITS.name} characters`;
  // Letters (including accented ones), spaces, apostrophes, hyphens, dots.
  if (!/^[A-Za-zÀ-ÖØ-öø-ɏ][A-Za-zÀ-ÖØ-öø-ɏ .'’-]*$/.test(s)) return `Use letters only in your ${label}`;
  return null;
}

export function checkEmail(v: string): Check {
  const s = v.trim();
  if (!s) return 'Add your email';
  if (s.length > LIMITS.email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)) return "That email doesn't look right";
  return null;
}

// The password rules, shown as a checklist under every "choose a
// password" box (sign-up, reset) and checked again on the server
// (functions/otp.js). Logging in with an older password still works.
export const PASSWORD_RULES: { key: string; label: string; fix: string; test: (v: string) => boolean }[] = [
  { key: 'length', label: 'At least 8 characters', fix: 'Use at least 8 characters', test: (v) => v.length >= 8 },
  { key: 'upper', label: 'An uppercase letter (A–Z)', fix: 'Add an uppercase letter (A–Z)', test: (v) => /[A-Z]/.test(v) },
  { key: 'lower', label: 'A lowercase letter (a–z)', fix: 'Add a lowercase letter (a–z)', test: (v) => /[a-z]/.test(v) },
  { key: 'number', label: 'A number (0–9)', fix: 'Add a number (0–9)', test: (v) => /\d/.test(v) },
  { key: 'symbol', label: 'A symbol, like ! @ # ? or *', fix: 'Add a symbol, like ! @ # ? or *', test: (v) => /[^A-Za-z0-9\s]/.test(v) },
  { key: 'spaces', label: 'No spaces', fix: 'Take out the spaces', test: (v) => !/\s/.test(v) },
];

export function checkPassword(v: string): Check {
  if (!v) return 'Choose a password';
  if (v.length > LIMITS.password) return `Keep it under ${LIMITS.password} characters`;
  const failed = PASSWORD_RULES.find((r) => !r.test(v));
  return failed ? failed.fix : null;
}

// "Confirm password" must be typed exactly the same.
export function checkPasswordMatch(password: string, confirm: string): Check {
  if (!confirm) return 'Type your password again';
  if (confirm !== password) return "The passwords don't match";
  return null;
}

// South African mobile numbers in any common format: 082 123 4567,
// 82 123 4567, +27 82 123 4567 or 27821234567. Returns the 9 digits
// after the country code, or null if it isn't a valid mobile number.
function saMobileDigits(v: string): string | null {
  let d = v.replace(/[\s()-]/g, '');
  if (!/^\+?\d+$/.test(d)) return null;
  d = d.replace(/^\+/, '');
  if (d.startsWith('27')) d = d.slice(2);
  else if (d.startsWith('0')) d = d.slice(1);
  return /^[6-8]\d{8}$/.test(d) ? d : null;
}

export function checkPhone(v: string, required = false): Check {
  if (!v.trim()) return required ? 'Add a phone number' : null;
  return saMobileDigits(v) ? null : 'Use a South African mobile number, e.g. 082 123 4567';
}

// Stored format: +27821234567 (works for WhatsApp links). Empty stays empty.
export function normalizePhone(v: string): string {
  const d = saMobileDigits(v);
  return d ? `+27${d}` : '';
}

export function checkAccountNumber(v: string): Check {
  const d = v.replace(/\s/g, '');
  if (!d) return 'Add your account number';
  if (!/^\d+$/.test(d)) return 'Use digits only';
  if (d.length < 6 || d.length > 16) return 'Account numbers are 6 to 16 digits';
  return null;
}

export function checkBranchCode(v: string): Check {
  const d = v.replace(/\s/g, '');
  if (!d) return 'Add the branch code';
  return /^\d{6}$/.test(d) ? null : 'Branch codes are 6 digits';
}

export function checkGuests(v: string): Check {
  if (!v.trim()) return null; // optional
  if (!/^\d+$/.test(v.trim())) return 'Use a whole number';
  const n = Number(v);
  if (n < 1 || n > 10000) return 'Between 1 and 10,000 guests';
  return null;
}

export function checkText(v: string, label: string, max = LIMITS.longText, required = true): Check {
  const s = v.trim();
  if (!s) return required ? `Add ${label}` : null;
  if (s.length > max) return `Keep it under ${max} characters`;
  return null;
}

// Collects the checks for a form: { field: message } for the ones that failed.
export function collectErrors(checks: Record<string, Check>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, msg] of Object.entries(checks)) if (msg) out[k] = msg;
  return out;
}
