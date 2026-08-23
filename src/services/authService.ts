import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';
import { UserProfile } from '../types';

// Called from the Register screen.
// Takes the form data, creates the Firebase Auth account,
// then creates the matching Firestore user document.
export async function registerUser(
  name: string,
  email: string,
  password: string,
  phone: string,
  dob: string
) {
  // Step 1: create the actual login credential in Firebase Auth.
  // This returns a "userCredential" object containing the new user's uid.
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;

  // Step 2: build the profile document that matches your REAL schema exactly.
  // Note: role is hardcoded to "resident" — matches what's already in Firestore,
  // mobile users are never anything else.
  const profile: UserProfile = {
    name,
    email,
    phone,
    dob,
    role: 'resident',
    createdAt: new Date().toISOString(),
  };

  // Step 3: write that profile to Firestore at users/{uid}.
  // setDoc with a specific ID (uid) means "create this document
  // with THIS exact ID" — not an auto-generated one — which is required
  // so it lines up with the Auth UID for future lookups.
  await setDoc(doc(db, 'users', uid), profile);

  return uid;
}

// Called from the Login screen. Just wraps Firebase's sign-in call.
// AuthContext's onAuthStateChanged listener will pick up the result
// automatically — this function doesn't need to update any state itself.
export async function loginUser(email: string, password: string) {
  await signInWithEmailAndPassword(auth, email, password);
}

// Called from the Profile screen later.
export async function logoutUser() {
  await signOut(auth);
}