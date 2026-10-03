import { deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { RefundBank, UserProfile } from '../types';
import { normalizeDates } from '../lib/firestoreData';

// Fetches the current user's profile document from Firestore.
// AuthContext only gives us the Auth object (email + uid), not the
// extra fields we stored separately in users/{uid}.
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return normalizeDates(snap.data()) as UserProfile;
}

// Updates editable profile fields. Email and role are intentionally
// excluded — email is tied to the Auth account (changing it here
// wouldn't change login credentials), and role is fixed at "resident"
// for all mobile-registered users, so neither should be user-editable.
export async function updateUserProfile(
  uid: string,
  updates: Partial<Pick<UserProfile, 'name' | 'phone' | 'dob' | 'interests'>>
) {
  await updateDoc(doc(db, 'users', uid), updates);
}

// Refund bank details: only ever used to pay refunds out.
export async function saveRefundBank(uid: string, bank: RefundBank) {
  await updateDoc(doc(db, 'users', uid), { refundBank: bank });
}

export async function deleteUserProfile(uid: string, reason?: string) {
  await deleteDoc(doc(db, 'users', uid));
  if (reason) console.log('Account deleted, reason:', reason);
}

export function last4(n?: string) {
  return n ? n.replace(/\s/g, '').slice(-4) : '';
}
