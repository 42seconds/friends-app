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
} from 'firebase/firestore';
import { PurchasedTicket } from '../types';

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
  totalPrice: number;
}

function generateTicketId(): string {
  return 'TKT-' + Math.random().toString(36).slice(2, 10).toUpperCase();
}

export async function createTicket(input: CreateTicketInput) {
  const ticketId = generateTicketId();

  await setDoc(doc(db, 'tickets', ticketId), {
    ...input,
    total: input.totalPrice,
    status: 'pending_payment',
    proofOfPayment: '',
    qrCode: '',
    createdAt: new Date().toISOString(),
    purchasedAt: new Date().toISOString(),
  });

  return ticketId;
}

export async function getTicketById(ticketId: string) {
  const snap = await getDoc(doc(db, 'tickets', ticketId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<PurchasedTicket, 'id'>) };
}

export function listenToTicket(
  ticketId: string,
  callback: (ticket: PurchasedTicket | null) => void
) {
  const ticketRef = doc(db, 'tickets', ticketId);
  const unsubscribe = onSnapshot(ticketRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    callback({ id: snapshot.id, ...(snapshot.data() as Omit<PurchasedTicket, 'id'>) });
  });
  return unsubscribe;
}

export function listenToUserTickets(
  userId: string,
  callback: (tickets: PurchasedTicket[]) => void
) {
  const ticketsRef = collection(db, 'tickets');
  const userQuery = query(ticketsRef, where('userId', '==', userId));
  const unsubscribe = onSnapshot(userQuery, (snapshot) => {
    const tickets: PurchasedTicket[] = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<PurchasedTicket, 'id'>),
    }));
    callback(tickets);
  });
  return unsubscribe;
}

// Live listener on every ticket waiting for payment review — powers the
// Approvals screen, no refresh needed.
export function listenToPendingTickets(callback: (tickets: any[]) => void) {
  const ticketsRef = collection(db, 'tickets');
  const pendingQuery = query(ticketsRef, where('status', '==', 'pending_verification'));
  return onSnapshot(pendingQuery, (snapshot) => {
    const tickets = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(tickets);
  });
}

// Payment approval — records WHO approved it for an audit trail.
export async function approveTicket(ticketId: string, adminUid: string) {
  const ticketRef = doc(db, 'tickets', ticketId);
  const now = new Date().toISOString();
  await updateDoc(ticketRef, {
    status: 'confirmed',
    validated: true,
    validatedAt: now,
    confirmedBy: adminUid,
  });
}

export async function rejectTicket(ticketId: string, adminUid: string) {
  const ticketRef = doc(db, 'tickets', ticketId);
  const now = new Date().toISOString();
  await updateDoc(ticketRef, {
    status: 'rejected',
    rejectedBy: adminUid,
    rejectedAt: now,
  });
}

// Door check-in — completely separate from payment approval. Does NOT
// touch status/validated at all: those belong to the approval flow
// above. This only marks that the ticket holder physically walked in.
export async function checkInTicket(ticketId: string) {
  const ticketRef = doc(db, 'tickets', ticketId);
  const now = new Date().toISOString();
  await updateDoc(ticketRef, {
    checkedIn: true,
    checkedInAt: now,
  });
  return now;
}