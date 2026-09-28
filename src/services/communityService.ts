import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

// ---- Waitlist ------------------------------------------------------
// One doc per (event, user): waitlist/{eventId}_{uid}. Position is how
// many people joined the same event's list before you.

export interface WaitlistEntry {
  eventId: string;
  userId: string;
  userName: string;
  quantity: number;
  whatsappAlerts: boolean;
  joinedAt: string;
  // Set by staff/backend when a released ticket is offered to this person.
  offerExpiresAt?: string;
}

export async function joinWaitlist(entry: Omit<WaitlistEntry, 'joinedAt'>) {
  await setDoc(doc(db, 'waitlist', `${entry.eventId}_${entry.userId}`), { ...entry, joinedAt: new Date().toISOString() });
}

export async function leaveWaitlist(eventId: string, userId: string) {
  await deleteDoc(doc(db, 'waitlist', `${eventId}_${userId}`));
}

export async function setWaitlistAlerts(eventId: string, userId: string, whatsappAlerts: boolean) {
  await setDoc(doc(db, 'waitlist', `${eventId}_${userId}`), { whatsappAlerts }, { merge: true });
}

export function listenToWaitlist(eventId: string, userId: string, cb: (state: { entry: WaitlistEntry | null; position: number; total: number }) => void) {
  const q = query(collection(db, 'waitlist'), where('eventId', '==', eventId));
  return onSnapshot(q, (snap) => {
    const all = snap.docs.map((d) => d.data() as WaitlistEntry).sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
    const idx = all.findIndex((e) => e.userId === userId);
    cb({ entry: idx >= 0 ? all[idx] : null, position: idx + 1, total: all.length });
  });
}

export async function getWaitlistCount(eventId: string) {
  const snap = await getDocs(query(collection(db, 'waitlist'), where('eventId', '==', eventId)));
  return snap.size;
}

// ---- Host enquiries ----------------------------------------------------

export interface Enquiry {
  userId: string | null;
  name: string;
  email: string;
  company: string;
  type: string;
  space: string;
  date: string;
  guests: string;
  vibe: string;
}

export async function sendEnquiry(input: Enquiry) {
  const ref = await addDoc(collection(db, 'enquiries'), { ...input, status: 'received', createdAt: new Date().toISOString() });
  return ref.id;
}

// ---- Ratings -----------------------------------------------------------

export async function sendRating(input: { eventId: string; userId: string | null; stars: number; highlights: string[]; fix: string; anonymous: boolean }) {
  await addDoc(collection(db, 'ratings'), { ...input, createdAt: new Date().toISOString() });
}

// ---- Promo / access codes --------------------------------------------
// promoCodes/{CODE} = { percentOff: number, active: boolean, eventId?: string }

export async function lookupPromo(code: string, eventId: string): Promise<{ code: string; percentOff: number } | null> {
  const clean = code.trim().toUpperCase();
  if (!clean) return null;
  const snap = await getDoc(doc(db, 'promoCodes', clean));
  if (!snap.exists()) return null;
  const data = snap.data() as { percentOff?: number; active?: boolean; eventId?: string };
  if (data.active === false) return null;
  if (data.eventId && data.eventId !== eventId) return null;
  return { code: clean, percentOff: data.percentOff ?? 0 };
}
