import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { UserProfile } from '../types';

// Fetches the current user's profile document from Firestore.
// Called on Profile screen mount to display their real name/phone/dob,
// since AuthContext only gives us the Auth object (email + uid),
// not the extra fields we stored separately in users/{uid}.
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

// Updates editable profile fields. Email and role are intentionally
// excluded — email is tied to the Auth account (changing it here
// wouldn't change login credentials), and role is fixed at "resident"
// for all mobile-registered users, so neither should be user-editable.
export async function updateUserProfile(
  uid: string,
  updates: Partial<Pick<UserProfile, 'name' | 'phone' | 'dob'>>
) {
  await updateDoc(doc(db, 'users', uid), updates);
}