import {
  createUserWithEmailAndPassword,
  deleteUser,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';
import { UserProfile } from '../types';
import { deleteUserProfile } from './userService';
import { signOutOfGoogle } from './googleAuth';
import { sendCode, verifyCode } from './otpService';
import { clearAdminTrust } from '../lib/adminTrust';
import { EMAIL_CODES_MODE, EMAIL_CODES_ON } from '../config/emailCodes';
import { disableQuickLogin } from '../lib/quickLogin';

interface RegisterUserInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  interests?: string[];
}

// Called from the Register screen.
// Takes the form data as a single object, creates the Firebase Auth
// account, then creates the matching Firestore user document.
export async function registerUser(input: RegisterUserInput) {
  const { name, email, phone, password, interests = [] } = input;

  // Step 1: create the actual login credential in Firebase Auth.
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;

  // Step 2: build the profile document matching the real Firestore schema.
  const profile: UserProfile = {
    name,
    email,
    phone,
    role: 'resident',
    interests,
    createdAt: new Date().toISOString(),
  };

  // Step 3: write that profile to Firestore at users/{uid}.
  await setDoc(doc(db, 'users', uid), profile);

  // Step 4: confirm the email. With the code server, the "Confirm your
  // email" screen emails a 6-digit code; without it, Firebase emails a
  // link now (not awaited, so a slow email service never blocks sign-up).
  if (!EMAIL_CODES_ON) sendEmailVerification(userCredential.user).catch(() => {});
  return uid;
}

// Called from the Login screen. Just wraps Firebase's sign-in call.
// AuthContext's onAuthStateChanged listener will pick up the result
// automatically — this function doesn't need to update any state itself.
export async function loginUser(email: string, password: string) {
  await signInWithEmailAndPassword(auth, email, password);
}

export async function logoutUser() {
  // The admin code step is asked again at the next login.
  const uid = auth.currentUser?.uid;
  if (uid) await clearAdminTrust(uid);
  await signOut(auth);
  await signOutOfGoogle();
}

// Forgot password without the code server: Firebase emails a reset link.
// "No account with that email" is treated like success, so the screen
// never reveals who is signed up.
export async function resetPasswordLink(email: string) {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (e: any) {
    if (String(e?.code ?? '').includes('user-not-found')) return;
    throw e;
  }
}

// Sends (again) Firebase's "confirm your email" link.
export async function resendVerification() {
  if (!auth.currentUser) throw new Error('Not logged in');
  await sendEmailVerification(auth.currentUser);
}

// Forgot password, step 1: email a 6-digit code. The server answers the
// same whether or not there's an account, so the screen never reveals who
// is signed up.
export async function resetPassword(email: string) {
  return sendCode('reset-password', email.trim());
}

// Forgot password, step 2: the code from the email and the new password.
// Logs the account out everywhere else.
export async function confirmPasswordReset(email: string, code: string, newPassword: string) {
  await verifyCode('reset-password', code, { email: email.trim(), newPassword });
}

// Firebase refuses to delete an account whose login is old
// ("auth/requires-recent-login"); callers should ask the user to log in
// again and retry.
export async function deleteAccount(reason?: string) {
  const user = auth.currentUser;
  if (!user) return;
  await deleteUserProfile(user.uid, reason);
  await deleteUser(user);
  await disableQuickLogin();
}

// Emails the logged-in person a 6-digit code to confirm their email.
export async function sendVerificationCode() {
  if (!auth.currentUser) throw new Error('Not logged in');
  return sendCode('verify-email');
}

// Checks the code; the server then marks the email as confirmed.
export async function confirmEmailCode(code: string) {
  await verifyCode('verify-email', code);
  // Demo mode marks the profile instead of Firebase's flag (demoCodes.ts).
  if (EMAIL_CODES_MODE === 'emailjs') return true;
  return checkEmailVerified();
}

// Asks Firebase whether the email is confirmed (it's changed on the
// server, so the app has to reload it). Refreshes the login token so the
// new status is used everywhere.
export async function checkEmailVerified(): Promise<boolean> {
  const u = auth.currentUser;
  if (!u) return false;
  await u.reload();
  if (u.emailVerified) await u.getIdToken(true).catch(() => {});
  return !!auth.currentUser?.emailVerified;
}

// Errors for the reset-password email. Firebase doesn't say whether an
// account exists (email enumeration protection), so there is no
// "no such user" case here.
export function resetErrorMessage(err: any): string {
  const code: string = err?.code ?? '';
  if (code.includes('invalid-email') || code.includes('missing-email')) return "That email doesn't look right.";
  if (code.includes('too-many-requests')) return 'Too many tries. Wait a few minutes, then try again.';
  if (code.includes('network')) return "You're offline. Connect to the internet and try again.";
  return "We couldn't send the link. Please try again.";
}

// Friendly copy for Firebase auth errors.
export function authErrorMessage(err: any): string {
  const code: string = err?.code ?? '';
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) return "That email and password don't match. Check for typos, or tap Forgot password? to reset it.";
  if (code.includes('user-disabled')) return 'This account has been switched off. Contact us if you think this is a mistake.';
  if (code.includes('email-already-in-use')) return 'There is already an account with that email. Try logging in.';
  if (code.includes('invalid-email')) return "That email doesn't look right.";
  if (code.includes('weak-password')) return 'Use at least 8 characters.';
  if (code.includes('too-many-requests')) return 'Too many tries. Wait a minute and try again.';
  if (code.includes('network')) return "You're offline. Check your connection and try again.";
  if (code.includes('requires-recent-login')) return 'For your safety, log out and back in, then try again.';
  return 'Something went wrong. Please try again.';
}
