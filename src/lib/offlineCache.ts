import AsyncStorage from '@react-native-async-storage/async-storage';

// Saves the last data the app loaded (events, your bookings, your profile)
// on the phone, so screens open instantly and still work without signal.
const PREFIX = 'offline:';

export async function readCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeCache(key: string, value: unknown) {
  AsyncStorage.setItem(PREFIX + key, JSON.stringify(value)).catch(() => {});
}

// Firestore without a connection answers with an empty "from cache" list.
// That must not replace what we saved while online.
export function shouldKeepSaved(fresh: unknown[], fromCache: boolean, saved: unknown[] | null) {
  return fromCache && fresh.length === 0 && !!saved?.length;
}
