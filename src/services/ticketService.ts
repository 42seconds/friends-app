import { db } from '../firebase/firebaseConfig';
import {
  setDoc,
  getDoc,
  doc,
  onSnapshot,
  updateDoc,
  collection,
  query,
  where,
  deleteField,
} from 'firebase/firestore';
import { PurchasedTicket, TicketStatus } from '../types';
import { HOLD_HOURS } from '../config/pricing';
import { byDate } from '../lib/firestoreData';
import { toTicket, holdEndsAt, effectiveStatus } from '../lib/tickets';

// Re-exported so screens can keep importing them from here.
export { toTicket, holdEndsAt, effectiveStatus };

// Listener errors (offline, or rules refusing access, e.g. right after
// logging out) are reported quietly instead of as uncaught errors.
function quiet(what: string, then?: () => void) {
  return (e: Error) => {
    console.warn(`Firestore ${what} listener stopped:`, e.message);
    then?.();
  };
}

interface CreateTicketInput {
  userId: string;
  userName: string;
  userEmail: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  eventImage: string;
  tag: string;
  tier: string;
  price: number;
  quantity: number;
  subtotal: number;
  serviceFee: number;
  vat: number;
  discount: number;
  promoCode?: string;
  totalPrice: number;
}

function generateTicketId(): string {
  return 'TKT-' + Math.random().toString(36).slice(2, 10).toUpperCase();
}

export async function createTicket(input: CreateTicketInput) {
  const ticketId = generateTicketId();
  const now = new Date();

  await setDoc(doc(db, 'tickets', ticketId), {
    ...input,
    promoCode: input.promoCode ?? '',
    total: input.totalPrice,
    status: 'pending_payment',
    proofOfPayment: '',
    qrCode: '',
    createdAt: now.toISOString(),
    purchasedAt: now.toISOString(),
    holdExpiresAt: new Date(now.getTime() + HOLD_HOURS * 3600 * 1000).toISOString(),
  });

  return ticketId;
}

export async function getTicketById(ticketId: string): Promise<PurchasedTicket | null> {
  const snap = await getDoc(doc(db, 'tickets', ticketId));
  if (!snap.exists()) return null;
  return toTicket(snap.id, snap.data());
}

export function listenToTicket(ticketId: string, callback: (ticket: PurchasedTicket | null) => void) {
  return onSnapshot(
    doc(db, 'tickets', ticketId),
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }
      callback(toTicket(snapshot.id, snapshot.data()));
    },
    quiet('ticket', () => callback(null))
  );
}

export function listenToUserTickets(userId: string, callback: (tickets: PurchasedTicket[]) => void, onError?: (e: Error) => void) {
  const userQuery = query(collection(db, 'tickets'), where('userId', '==', userId));
  return onSnapshot(
    userQuery,
    (snapshot) => {
      callback(snapshot.docs.map((d) => (toTicket(d.id, d.data()))));
    },
    onError
  );
}

// Staff: every booking in one payment state (Approvals tabs).
export function listenToTicketsByStatus(status: TicketStatus, callback: (tickets: PurchasedTicket[]) => void) {
  const q = query(collection(db, 'tickets'), where('status', '==', status));
  return onSnapshot(
    q,
    (snapshot) => {
      const tickets = snapshot.docs.map((d) => toTicket(d.id, d.data()));
      // Oldest first — guests wait on these.
      tickets.sort((a, b) => byDate(a.proofUploadedAt ?? a.createdAt, b.proofUploadedAt ?? b.createdAt));
      callback(tickets);
    },
    quiet('approvals', () => callback([]))
  );
}

// Kept for older callers: the pending-verification queue.
export function listenToPendingTickets(callback: (tickets: PurchasedTicket[]) => void) {
  return listenToTicketsByStatus('pending_verification', callback);
}

// Staff: every booking for one event (door dashboard + guest list).
export function listenToEventTickets(eventId: string, callback: (tickets: PurchasedTicket[]) => void) {
  const q = query(collection(db, 'tickets'), where('eventId', '==', eventId));
  return onSnapshot(
    q,
    (snapshot) => callback(snapshot.docs.map((d) => toTicket(d.id, d.data()))),
    quiet('event tickets', () => callback([]))
  );
}

// Payment approval — records WHO approved it for an audit trail.
export async function approveTicket(ticketId: string, adminUid: string) {
  const now = new Date().toISOString();
  await updateDoc(doc(db, 'tickets', ticketId), {
    status: 'confirmed',
    validated: true,
    validatedAt: now,
    confirmedBy: adminUid,
    rejection: deleteField(),
  });
}

export interface RejectInput {
  reason: string;
  message: string;
  keepHeld: boolean;
}

// Sends a booking back to the guest with a reason. When keepHeld is set
// the guest keeps their hold and only needs to upload a new proof.
export async function rejectTicket(ticketId: string, adminUid: string, input: RejectInput = { reason: 'Something else', message: '', keepHeld: true }) {
  const now = new Date().toISOString();
  await updateDoc(doc(db, 'tickets', ticketId), {
    status: 'rejected',
    rejectedBy: adminUid,
    rejectedAt: now,
    rejection: { ...input, at: now },
  });
}

export async function markProofUploaded(ticketId: string, proofOfPayment: string) {
  await updateDoc(doc(db, 'tickets', ticketId), {
    proofOfPayment,
    proofUploadedAt: new Date().toISOString(),
    status: 'pending_verification',
  });
}

export interface CheckInInput {
  door: string;
  staffName: string;
  staffUid: string;
  at?: string; // set when replaying a scan that was queued offline
}

// Door check-in — completely separate from payment approval. Does NOT
// touch status/validated at all: those belong to the approval flow
// above. This only marks that the ticket holder physically walked in.
export async function checkInTicket(ticketId: string, input?: CheckInInput) {
  const now = input?.at ?? new Date().toISOString();
  await updateDoc(doc(db, 'tickets', ticketId), {
    checkedIn: true,
    checkedInAt: now,
    ...(input ? { checkedInDoor: input.door, checkedInBy: input.staffName, checkedInByUid: input.staffUid } : {}),
  });
  return now;
}

// "Undo check-in" is for mistakes and is logged; "Check out" lets the
// guest back in later. Both clear the checked-in flag.
export async function undoCheckIn(ticketId: string, staffUid: string, mode: 'undo' | 'checkout') {
  await updateDoc(doc(db, 'tickets', ticketId), {
    checkedIn: false,
    [mode === 'undo' ? 'checkInUndoneBy' : 'checkedOutBy']: staffUid,
    [mode === 'undo' ? 'checkInUndoneAt' : 'checkedOutAt']: new Date().toISOString(),
  });
}

export async function saveStaffNote(ticketId: string, note: string) {
  await updateDoc(doc(db, 'tickets', ticketId), { staffNote: note });
}

// Guest -> friend transfer. The friend accepts through the claim link
// (handled on the web); until then the sender can cancel.
export async function startTransfer(ticketId: string, toName: string, toPhone: string) {
  await updateDoc(doc(db, 'tickets', ticketId), {
    transfer: { toName, toPhone, sentAt: new Date().toISOString(), status: 'pending' },
  });
}

export async function cancelTransfer(ticketId: string) {
  await updateDoc(doc(db, 'tickets', ticketId), { 'transfer.status': 'cancelled' });
}

export async function releaseToWaitlist(ticketId: string) {
  await updateDoc(doc(db, 'tickets', ticketId), { releasedToWaitlist: true, releasedAt: new Date().toISOString() });
}

export async function requestRefund(ticketId: string) {
  await updateDoc(doc(db, 'tickets', ticketId), { refundRequested: true, refundRequestedAt: new Date().toISOString() });
}
