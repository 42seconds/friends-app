import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// A tiny persisted store: state lives in memory for instant reads and is
// mirrored to AsyncStorage so it survives restarts. Used for device-local
// things (saved events, recent searches, preferences, staff door setup).
// Pass a null key for an in-memory-only store.
export function createPersistedStore<T>(key: string | null, initial: T) {
  let state = initial;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());

  if (key) AsyncStorage.getItem(key)
    .then((raw) => {
      if (raw) {
        state = { ...initial, ...JSON.parse(raw) };
        emit();
      }
    })
    .catch(() => {});

  const set = (next: Partial<T> | ((prev: T) => Partial<T>)) => {
    const patch = typeof next === 'function' ? next(state) : next;
    state = { ...state, ...patch };
    emit();
    if (key) AsyncStorage.setItem(key, JSON.stringify(state)).catch(() => {});
  };

  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  };

  function useStore(): T {
    return useSyncExternalStore(subscribe, () => state, () => state);
  }

  return { useStore, get: () => state, set };
}
