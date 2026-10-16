import { useEffect, useState } from 'react';
import { listenToUserTickets } from '../services/ticketService';
import { PurchasedTicket } from '../types';
import { useAuth } from '../context/AuthContext';
import { byDate } from '../lib/firestoreData';
import { readCache, writeCache, shouldKeepSaved } from '../lib/offlineCache';

// Wraps the ticket listener, automatically scoped to whoever is
// currently logged in. Newest bookings first.
export function useBookings() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<PurchasedTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTickets([]);
      setLoading(false);
      return;
    }
    // Your saved bookings first (they work without signal), then live.
    let live = false;
    let saved: PurchasedTicket[] | null = null;
    readCache<PurchasedTicket[]>(`tickets:${user.uid}`).then((t) => {
      saved = t;
      if (live || !t) return;
      setTickets(t);
      setLoading(false);
    });
    const unsubscribe = listenToUserTickets(
      user.uid,
      (data, fromCache) => {
        if (shouldKeepSaved(data, fromCache, saved)) return;
        const sorted = [...data].sort((a, b) => byDate(b.createdAt, a.createdAt));
        live = true;
        setTickets(sorted);
        setLoading(false);
        if (!fromCache) {
          saved = sorted;
          writeCache(`tickets:${user.uid}`, sorted);
        }
      },
      () => setLoading(false)
    );
    return () => unsubscribe();
  }, [user]);

  return { tickets, loading };
}
