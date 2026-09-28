import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { Event } from '../types';

// Listens to the events collection in real time, filtered to only
// published events (drafts stay hidden from the mobile app).
// onSnapshot = a LIVE listener, not a one-time fetch — if Kgahlisho
// publishes a new event on the admin website right now, this callback
// fires again automatically with the updated list, no refresh needed.
//
// Returns an "unsubscribe" function — calling it stops the listener.
export function listenToEvents(callback: (events: Event[]) => void, onError?: (e: Error) => void) {
  const publishedQuery = query(collection(db, 'events'), where('status', '==', 'published'));
  return onSnapshot(
    publishedQuery,
    (snapshot) => {
      callback(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Event, 'id'>) })));
    },
    onError
  );
}

// One-time fetch (not a live listener) for a single event by ID.
export async function getEventById(eventId: string): Promise<Event | null> {
  const snapshot = await getDoc(doc(db, 'events', eventId));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...(snapshot.data() as Omit<Event, 'id'>) };
}
