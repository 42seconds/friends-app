import { useEffect, useState } from 'react';
import { listenToUserTickets } from '../services/ticketService';
import { PurchasedTicket } from '../types';
import { useAuth } from '../context/AuthContext';
import { byDate } from '../lib/firestoreData';

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
    const unsubscribe = listenToUserTickets(
      user.uid,
      (data) => {
        setTickets([...data].sort((a, b) => byDate(b.createdAt, a.createdAt)));
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsubscribe();
  }, [user]);

  return { tickets, loading };
}
