import { useEffect, useState } from 'react';
import { listenToEvents } from '../services/eventService';
import { Event } from '../types';
import { isPast, parseEventDate } from '../lib/dates';
import { readCache, writeCache, shouldKeepSaved } from '../lib/offlineCache';

// Shared live listener: every screen that calls useEvents() reads the
// same Firestore subscription instead of opening its own.
let cache: Event[] = [];
let loaded = false;
let error: Error | null = null;
let unsubscribe: (() => void) | null = null;
const subscribers = new Set<() => void>();

let live = false; // true once Firestore has answered this session

function start() {
  if (unsubscribe) return;
  // Show the events saved last time straight away, then the live list.
  if (!live) readCache<Event[]>('events').then((saved) => {
    if (live || !saved?.length) return;
    cache = saved;
    loaded = true;
    subscribers.forEach((s) => s());
  });
  unsubscribe = listenToEvents(
    (data, fromCache) => {
      if (shouldKeepSaved(data, fromCache, cache)) return;
      // Soonest first; unparseable dates go last.
      cache = [...data].sort((a, b) => (parseEventDate(a.date, a.time)?.getTime() ?? Infinity) - (parseEventDate(b.date, b.time)?.getTime() ?? Infinity));
      loaded = true;
      live = true;
      error = null;
      if (!fromCache) writeCache('events', cache);
      subscribers.forEach((s) => s());
    },
    (e) => {
      error = e;
      loaded = true;
      subscribers.forEach((s) => s());
    }
  );
}

// Restart the listener after a failure (offline "Try again").
export function retryEvents() {
  unsubscribe?.();
  unsubscribe = null;
  loaded = false;
  error = null;
  subscribers.forEach((s) => s());
  start();
}

export function useEvents() {
  const [, force] = useState(0);

  useEffect(() => {
    const tick = () => force((n) => n + 1);
    subscribers.add(tick);
    start();
    return () => {
      subscribers.delete(tick);
      if (subscribers.size === 0 && unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    };
  }, []);

  const upcoming = cache.filter((e) => !isPast(e.date, e.time));
  const past = cache.filter((e) => isPast(e.date, e.time)).reverse();
  return { events: cache, upcoming, past, loading: !loaded, error };
}

export function useEvent(id?: string) {
  const { events, loading } = useEvents();
  return { event: events.find((e) => e.id === id) ?? null, loading };
}
