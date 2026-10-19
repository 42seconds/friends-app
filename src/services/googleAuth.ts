import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';
import { GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from '../config/google';
import { getUserProfile } from './userService';
import { UserProfile } from '../types';

// Google sign-in needs the app's own native code, so it works in the
// installed app (the APK from CI, or a development build) but not in
// Expo Go or on the web. Screens hide the button when it's unavailable.
export const googleSignInAvailable =
  Platform.OS !== 'web' &&
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient &&
  (Platform.OS === 'android' || !!GOOGLE_IOS_CLIENT_ID);

// Loaded on demand so Expo Go never touches the missing native module.
function googleSignin() {
  const mod = require('@react-native-google-signin/google-signin') as typeof import('@react-native-google-signin/google-signin');
  mod.GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID, iosClientId: GOOGLE_IOS_CLIENT_ID || undefined });
  return mod;
}

export class GoogleSignInCancelled extends Error {}

// Shows Google's account picker, signs into Firebase with the chosen
// account and, the first time, creates the users/{uid} profile.
// Returns whether this was a brand-new account.
export async function signInWithGoogle(): Promise<{ isNew: boolean }> {
  const { GoogleSignin, isSuccessResponse } = googleSignin();
  if (Platform.OS === 'android') await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const res = await GoogleSignin.signIn();
  if (!isSuccessResponse(res)) throw new GoogleSignInCancelled();
  const idToken = res.data.idToken;
  if (!idToken) throw new Error('Google did not return an ID token');

  const { user } = await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));

  if (await getUserProfile(user.uid)) return { isNew: false };
  const profile: UserProfile = {
    name: res.data.user.name ?? user.displayName ?? '',
    email: user.email ?? res.data.user.email,
    phone: '',
    role: 'resident',
    interests: [],
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(db, 'users', user.uid), profile);
  return { isNew: true };
}

// Clears the remembered Google account so the picker shows next time.
export async function signOutOfGoogle() {
  if (!googleSignInAvailable) return;
  try {
    await googleSignin().GoogleSignin.signOut();
  } catch {
    // Not signed in with Google: nothing to clear.
  }
}

export function googleErrorMessage(err: any): string {
  const code = String(err?.code ?? '');
  if (code === 'IN_PROGRESS') return 'Google sign-in is already open.';
  if (code === 'PLAY_SERVICES_NOT_AVAILABLE') return 'Google Play services are needed for Google sign-in.';
  if (code.includes('network') || code === '7') return "You're offline. Check your connection and try again.";
  if (code === '10' || code.includes('DEVELOPER_ERROR')) return "Google sign-in isn't set up for this build yet.";
  return "Couldn't sign in with Google. Try again or use your email.";
}
