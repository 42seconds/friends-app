import { useEffect, useState } from 'react';
import { listenToTicket } from '../services/ticketService';
import { PurchasedTicket } from '../types';
import { useAuth } from '../context/AuthContext';
import { readCache, writeCache } from '../lib/offlineCache';

// Live view of one booking (status changes arrive the moment staff act).
export function useTicket(ticketId?: string) {
  const [ticket, setTicket] = useState<PurchasedTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  useEffect(() => {
    if (!ticketId) {
      setLoading(false);
      return;
    }
    // The saved copy shows the QR at the door even without signal.
    let live = false;
    readCache<PurchasedTicket>(`ticket:${ticketId}`)
      .then(async (t) => t ?? (user ? (await readCache<PurchasedTicket[]>(`tickets:${user.uid}`))?.find((x) => x.id === ticketId) ?? null : null))
      .then((t) => {
        if (live || !t) return;
        setTicket(t);
        setLoading(false);
      });
    return listenToTicket(ticketId, (t) => {
      // No answer (offline): keep the saved copy if there is one.
      if (!t && !live) {
        setLoading(false);
        return;
      }
      live = true;
      setTicket(t);
      setLoading(false);
      if (t) writeCache(`ticket:${ticketId}`, t);
    });
  }, [ticketId, user?.uid]);
  return { ticket, loading };
}
