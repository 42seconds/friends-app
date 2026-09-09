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
interface RegisterUserInput {
  name: string;
  email: string;
  phone: string;
  dob: string;
  password: string;
}

// Called from the Register screen.
// Takes the form data as a single object, creates the Firebase Auth
// account, then creates the matching Firestore user document.
export async function registerUser(input: RegisterUserInput) {
  const { name, email, phone, dob, password } = input;

  // Step 1: create the actual login credential in Firebase Auth.
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;

  // Step 2: build the profile document matching the real Firestore schema.
  const profile: UserProfile = {
    name,
    email,
    phone,
    dob,
    role: 'resident',
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

// Called from the Profile screen later.
export async function logoutUser() {
  await signOut(auth);
}