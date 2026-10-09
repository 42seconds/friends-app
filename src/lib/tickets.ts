import { PurchasedTicket, TicketStatus } from '../types';
import { normalizeDates } from './firestoreData';

// Every ticket read goes through here: dates become ISO strings, and
// bookings without createdAt fall back to purchasedAt. Bookings made on
// the website have no status or totalPrice, only validated and total,
// so those are mapped onto the app's fields.
export function toTicket(id: string, raw: any): PurchasedTicket {
  const d = normalizeDates(raw ?? {});
  return {
    id,
    ...d,
    status: d.status ?? (d.validated ? 'confirmed' : 'pending_payment'),
    totalPrice: d.totalPrice ?? d.total ?? 0,
    createdAt: d.createdAt ?? d.purchasedAt ?? '',
  } as PurchasedTicket;
}

// When the hold ends (holdExpiresAt is set when the app creates a booking).
export function holdEndsAt(t: Pick<PurchasedTicket, 'holdExpiresAt'>): number {
  if (t.holdExpiresAt) return new Date(t.holdExpiresAt).getTime();
  // Bookings from before holds existed (or made on the website) never
  // had a deadline, so they don't expire on their own.
  return Infinity;
}

// Unpaid holds lapse client-side too, so the UI is right even before
// the backend sweeps them.
export function effectiveStatus(t: PurchasedTicket): TicketStatus {
  if (t.status === 'pending_payment' && holdEndsAt(t) < Date.now()) return 'expired';
  return t.status;
}
