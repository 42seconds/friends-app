import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

// Admin 2-step verification: after logging in, an admin also enters a
// code emailed to them. That unlocks staff mode on this device for 12
// hours (the server decides how long and also records it on the account).
// Logging out forgets it, so the next login asks again.
const key = (uid: string) => `adminTrust:${uid}`;

let current: { uid: string; until: number } | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export async function loadAdminTrust(uid: string): Promise<number> {
  if (current?.uid === uid) return current.until;
  const raw = await AsyncStorage.getItem(key(uid)).catch(() => null);
  const until = Number(raw) || 0;
  current = { uid, until };
  return until;
}

export function setAdminTrust(uid: string, until: number) {
  current = { uid, until };
  AsyncStorage.setItem(key(uid), String(until)).catch(() => {});
  notify();
}

export async function clearAdminTrust(uid: string) {
  if (current?.uid === uid) current = { uid, until: 0 };
  await AsyncStorage.removeItem(key(uid)).catch(() => {});
  notify();
}

export function isTrusted(until: number, now = Date.now()) {
  return until > now;
}

// Whether this user has passed the admin code step on this device (and it
// hasn't run out); null while loading.
export function useAdminTrusted(uid?: string | null): boolean | null {
  const [trusted, setTrusted] = useState<boolean | null>(null);
  useEffect(() => {
    if (!uid) {
      setTrusted(false);
      return;
    }
    let alive = true;
    const read = () => loadAdminTrust(uid).then((u) => alive && setTrusted(isTrusted(u)));
    setTrusted(null);
    read();
    listeners.add(read);
    // Notices when the 12 hours run out while the app is open.
    const tick = setInterval(read, 60_000);
    return () => {
      alive = false;
      listeners.delete(read);
      clearInterval(tick);
    };
  }, [uid]);
  return trusted;
}
