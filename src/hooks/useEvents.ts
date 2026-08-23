import { useEffect, useState } from 'react';
import { listenToEvents } from '../services/eventService';
import { Event } from '../types';

// Wraps the raw Firestore listener in a React-friendly hook.
// Any screen can just call useEvents() and get back live data +
// a loading flag, without knowing anything about Firestore underneath.
export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Start listening the moment this hook is used.
    const unsubscribe = listenToEvents((data) => {
      setEvents(data);
      setLoading(false);
    });

    // Cleanup: when the component using this hook unmounts
    // (e.g. user navigates away), stop listening. Without this,
    // every time you visited Home you'd stack up another active
    // listener running in the background forever.
    return () => unsubscribe();
  }, []);

  return { events, loading };
}