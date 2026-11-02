import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, increment, onSnapshot, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { byDate, normalizeDates } from '../lib/firestoreData';
import { AccessCode, CodeType, cleanCode, codeProblem, isWellFormed, toAccessCode } from '../lib/accessCodes';

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
  return onSnapshot(
    q,
    (snap) => {
      const all = snap.docs.map((d) => normalizeDates(d.data()) as WaitlistEntry).sort((a, b) => byDate(a.joinedAt, b.joinedAt));
      const idx = all.findIndex((e) => e.userId === userId);
      cb({ entry: idx >= 0 ? all[idx] : null, position: idx + 1, total: all.length });
    },
    (e) => {
      console.warn('Firestore waitlist listener stopped:', e.message);
      cb({ entry: null, position: 0, total: 0 });
    }
  );
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
// promoCodes/{CODE}: see src/lib/accessCodes.ts. Guests look a code up
// by its exact name; staff create, list and switch codes off.

// The code if it can be used for this event, or an error saying why not.
export async function lookupPromo(code: string, eventId: string): Promise<{ code?: AccessCode; error?: string }> {
  const clean = cleanCode(code);
  if (!isWellFormed(clean)) return { error: "That code isn't valid." };
  const snap = await getDoc(doc(db, 'promoCodes', clean));
  if (!snap.exists()) return { error: "That code isn't valid." };
  const c = toAccessCode(clean, snap.data());
  const problem = codeProblem(c, eventId);
  return problem ? { error: problem } : { code: c };
}

// Counts one booking against the code (best effort: a booking is never
// held up by it).
export async function recordCodeUse(code: string) {
  await updateDoc(doc(db, 'promoCodes', cleanCode(code)), { uses: increment(1) }).catch(() => {});
}

export interface NewAccessCode {
  code: string;
  type: CodeType;
  percentOff: number;
  label?: string;
  eventId?: string;
  maxUses?: number;
  expiresAt?: string;
  createdBy: string;
}

// Staff: creates a code. Fails if the code already exists.
export async function createAccessCode(c: NewAccessCode) {
  const ref = doc(db, 'promoCodes', cleanCode(c.code));
  if ((await getDoc(ref)).exists()) throw new Error('That code already exists. Try another.');
  const data: Record<string, unknown> = {
    type: c.type,
    percentOff: c.type === 'comp' ? 100 : c.percentOff,
    uses: 0,
    active: true,
    createdBy: c.createdBy,
    createdAt: new Date().toISOString(),
  };
  if (c.label) data.label = c.label;
  if (c.eventId) data.eventId = c.eventId;
  if (c.maxUses) data.maxUses = c.maxUses;
  if (c.expiresAt) {
    data.expiresAt = c.expiresAt;
    data.expiresAtMs = Date.parse(c.expiresAt); // for the security rules
  }
  await setDoc(ref, data);
}

export function listenToAccessCodes(callback: (codes: AccessCode[]) => void) {
  return onSnapshot(
    collection(db, 'promoCodes'),
    (snap) => callback(snap.docs.map((d) => toAccessCode(d.id, d.data())).sort((a, b) => byDate(b.createdAt, a.createdAt))),
    () => callback([])
  );
}

export async function setAccessCodeActive(code: string, active: boolean) {
  await updateDoc(doc(db, 'promoCodes', cleanCode(code)), { active });
}
