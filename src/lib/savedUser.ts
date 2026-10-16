import type { User } from 'firebase/auth';

// Firebase keeps the logged-in user in AsyncStorage under this key
// (see firebase/auth's React Native persistence).
export function savedUserKey(apiKey: string, appName = '[DEFAULT]') {
  return `firebase:authUser:${apiKey}:${appName}`;
}

// Turns Firebase's saved JSON into the few User fields the app reads
// (uid, email, name, metadata), or null if nothing usable is saved.
export function parseSavedUser(raw: string | null): User | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw);
    if (!d || typeof d.uid !== 'string' || !d.uid) return null;
    const time = (ms: unknown) => (ms ? new Date(Number(ms)).toUTCString() : undefined);
    return {
      uid: d.uid,
      email: d.email ?? null,
      displayName: d.displayName ?? null,
      emailVerified: !!d.emailVerified,
      metadata: { creationTime: time(d.createdAt), lastSignInTime: time(d.lastLoginAt) },
    } as unknown as User;
  } catch {
    return null;
  }
}
