import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { Event } from '../types';

// Listens to the events collection in real time, filtered to only
// published events (drafts stay hidden from the mobile app).
// onSnapshot = a LIVE listener, not a one-time fetch — if Kgahlisho
// publishes a new event on the admin website right now, this callback
// fires again automatically with the updated list, no refresh needed.
//
// Returns an "unsubscribe" function — calling it stops the listener.
// This matters for cleanup (see useEvents.ts) so we don't leak listeners
// every time a screen mounts/unmounts.
export function listenToEvents(callback: (events: Event[]) => void) {
  const eventsRef = collection(db, 'events');
  const publishedQuery = query(eventsRef, where('status', '==', 'published'));

  const unsubscribe = onSnapshot(publishedQuery, (snapshot) => {
    // snapshot.docs is an array of Firestore document objects.
    // We map each one into a plain Event object, pulling in doc.id
    // (Firestore's auto-generated ID) since it's not stored as a
    // field inside the document itself.
    const events: Event[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Event, 'id'>),
    }));
    callback(events);
  });

  return unsubscribe;
}

import { doc, getDoc } from 'firebase/firestore';
// One-time fetch (not a live listener) for a single event by ID.
// Event Detail doesn't need real-time updates the way the list does —
// if the admin edits an event while someone's viewing it, that's an
// acceptable edge case to ignore for the demo.
export async function getEventById(eventId: string): Promise<Event | null> {
  const eventRef = doc(db, 'events', eventId);
  const snapshot = await getDoc(eventRef);

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...(snapshot.data() as Omit<Event, 'id'>),
  };
}