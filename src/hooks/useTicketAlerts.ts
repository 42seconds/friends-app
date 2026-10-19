import { useEffect } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { listenToUserTickets } from '../services/ticketService';
import { notifyNow, handleNotificationTaps } from '../lib/notifications';
import { PurchasedTicket } from '../types';
import { alertFor } from '../lib/ticketAlerts';
import { registerPushToken, pushReady } from '../lib/push';

const KEY = 'nightTicketStatus';

// Watches the logged-in person's bookings and shows a phone notification
// when the team approves one or asks for a new proof. The last status we
// saw is kept on the phone, so an approval that happened while the app
// was closed is announced the next time it opens, and never twice.
export function useTicketAlerts() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => handleNotificationTaps((url) => router.push(url as any)), []);

  // Make sure this phone can get pushes while the app is closed.
  useEffect(() => {
    if (user) registerPushToken(user.uid);
  }, [user?.uid]);

  useEffect(() => {
    if (!user) return;
    let seen: Record<string, string> | null = null;
    let pending: PurchasedTicket[] | null = null;

    const process = (tickets: PurchasedTicket[]) => {
      if (!seen) {
        pending = tickets;
        return;
      }
      let changed = false;
      for (const t of tickets) {
        const before = seen[t.id];
        // First time we see a booking: remember it, don't announce it.
        if (before !== undefined) {
          const a = alertFor(t, before);
          // In the background the push from the team covers it.
          if (a && (AppState.currentState === 'active' || !pushReady())) notifyNow(a.title, a.body, a.url);
        }
        if (before !== t.status) {
          seen[t.id] = t.status;
          changed = true;
        }
      }
      if (changed) AsyncStorage.setItem(`${KEY}:${user.uid}`, JSON.stringify(seen)).catch(() => {});
    };

    AsyncStorage.getItem(`${KEY}:${user.uid}`)
      .then((raw) => (seen = raw ? JSON.parse(raw) : {}))
      .catch(() => (seen = {}))
      .finally(() => pending && process(pending));

    return listenToUserTickets(user.uid, process, () => {});
  }, [user?.uid]);
}
