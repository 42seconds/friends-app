import {
  createUserWithEmailAndPassword,
  deleteUser,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';
import { UserProfile } from '../types';
import { deleteUserProfile } from './userService';
import { signOutOfGoogle } from './googleAuth';

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

  return uid;
}

// Called from the Login screen. Just wraps Firebase's sign-in call.
// AuthContext's onAuthStateChanged listener will pick up the result
// automatically — this function doesn't need to update any state itself.
export async function loginUser(email: string, password: string) {
  await signInWithEmailAndPassword(auth, email, password);
}

export async function logoutUser() {
  await signOut(auth);
  await signOutOfGoogle();
}

// "No account with that email" is treated like success, so the screen never
// reveals who is signed up (projects without Firebase's email enumeration
// protection would otherwise say so).
export async function resetPassword(email: string) {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (e: any) {
    if (String(e?.code ?? '').includes('user-not-found')) return;
    throw e;
  }
}

// Firebase refuses to delete an account whose login is old
// ("auth/requires-recent-login"); callers should ask the user to log in
// again and retry.
export async function deleteAccount(reason?: string) {
  const user = auth.currentUser;
  if (!user) return;
  await deleteUserProfile(user.uid, reason);
  await deleteUser(user);
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
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) return "That email and password don't match. Forgot your password? Tap the link above to reset it.";
  if (code.includes('email-already-in-use')) return 'There is already an account with that email. Try logging in.';
  if (code.includes('invalid-email')) return "That email doesn't look right.";
  if (code.includes('weak-password')) return 'Use at least 8 characters.';
  if (code.includes('too-many-requests')) return 'Too many tries. Wait a minute and try again.';
  if (code.includes('network')) return "You're offline. Check your connection and try again.";
  if (code.includes('requires-recent-login')) return 'For your safety, log out and back in, then try again.';
  return 'Something went wrong. Please try again.';
}
