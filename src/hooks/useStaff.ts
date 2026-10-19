import { useEffect, useMemo, useState } from 'react';
import { checkInTicket, getTicketById, listenToEventTickets } from '../services/ticketService';
import { scanQueueStore, staffStore } from '../store';
import { useEvents } from './useEvents';
import { PurchasedTicket } from '../types';

// Tickets for the event staff are working tonight, live.
export function useDoorTickets() {
  const setup = staffStore.useStore();
  const { upcoming, events } = useEvents();
  const event = events.find((e) => e.id === setup.eventId) ?? upcoming[0] ?? null;
  const [tickets, setTickets] = useState<PurchasedTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!event) {
      setLoading(false);
      return;
    }
    setLoading(true);
    return listenToEventTickets(event.id, (t) => {
      setTickets(t);
      setLoading(false);
    });
  }, [event?.id]);

  const stats = useMemo(() => {
    const live = tickets.filter((t) => t.status !== 'rejected');
    const sum = (xs: PurchasedTicket[]) => xs.reduce((n, t) => n + (t.quantity || 1), 0);
    const confirmed = tickets.filter((t) => t.status === 'confirmed');
    return {
      sold: sum(live),
      verified: sum(confirmed),
      toReview: tickets.filter((t) => t.status === 'pending_verification').length,
      checkedIn: sum(confirmed.filter((t) => t.checkedIn)),
      capacity: event?.capacity ?? sum(confirmed),
    };
  }, [tickets, event]);

  return { event, door: setup.door, tickets, loading, stats };
}

// Replays check-ins saved while offline. Returns how many synced.
export async function syncQueuedScans() {
  const { scans } = scanQueueStore.get();
  const left = [];
  let done = 0;
  for (const s of scans) {
    try {
      // First scan wins: if another door already checked them in, drop ours.
      const t = await getTicketById(s.ticketId);
      if (t && !t.checkedIn) await checkInTicket(s.ticketId, { door: s.door, staffName: s.staffName, staffUid: s.staffUid, at: s.at });
      done++;
    } catch {
      left.push(s);
    }
  }
  scanQueueStore.set({ scans: left, lastSyncedAt: done ? new Date().toISOString() : scanQueueStore.get().lastSyncedAt });
  return done;
}
