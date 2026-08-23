import { useEffect, useState } from 'react';
import { listenToUserTickets } from '../services/ticketService';
import { PurchasedTicket } from '../types';
import { useAuth } from '../context/AuthContext';

// Wraps the ticket listener, automatically scoped to whoever is
// currently logged in. Screens just call useBookings() — no need
// to pass a userId manually or know anything about Firestore.
export function useBookings() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<PurchasedTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Guard: don't attempt to listen if there's no logged-in user yet
    // (e.g. during the brief moment AuthContext is still resolving).
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubscribe = listenToUserTickets(user.uid, (data) => {
      setTickets(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return { tickets, loading };
}