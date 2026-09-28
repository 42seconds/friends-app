import { useEffect, useState } from 'react';
import { listenToTicket } from '../services/ticketService';
import { PurchasedTicket } from '../types';

// Live view of one booking (status changes arrive the moment staff act).
export function useTicket(ticketId?: string) {
  const [ticket, setTicket] = useState<PurchasedTicket | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!ticketId) {
      setLoading(false);
      return;
    }
    return listenToTicket(ticketId, (t) => {
      setTicket(t);
      setLoading(false);
    });
  }, [ticketId]);
  return { ticket, loading };
}
