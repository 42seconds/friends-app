import NetInfo from '@react-native-community/netinfo';

// Browsing works offline. Buying, logging in and signing up need the
// internet, so those actions check first and say so straight away
// instead of waiting on a request that can't go anywhere.
export const OFFLINE_MESSAGE = "You're offline. Browsing still works, but this needs an internet connection.";

export class OfflineError extends Error {
  code = 'auth/network-request-failed'; // matches the existing "you're offline" error messages
  constructor() {
    super(OFFLINE_MESSAGE);
  }
}

export async function isOnline() {
  try {
    const s = await NetInfo.fetch();
    return s.isConnected !== false && s.isInternetReachable !== false;
  } catch {
    return true; // can't tell: let the request try
  }
}

export async function requireOnline() {
  if (!(await isOnline())) throw new OfflineError();
}

// Firestore keeps a write waiting until it reaches the server, so a
// connection that drops mid-way would spin forever. Give up after `ms`.
export function withTimeout<T>(p: Promise<T>, ms = 20000): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new OfflineError()), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

export const isOfflineError = (e: unknown) => e instanceof OfflineError;
