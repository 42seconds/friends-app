import { useSyncExternalStore } from 'react';

// True while the sign-up screen is creating an account. Creating it logs
// the person in at once, and without this the redirect gate would send
// them to the guide before the sign-up screen could open "Confirm your
// email". The sign-up screen sets it, then leads the way itself.
let signingUp = false;
const listeners = new Set<() => void>();

export function setSigningUp(v: boolean) {
  if (signingUp === v) return;
  signingUp = v;
  listeners.forEach((l) => l());
}

export function useSigningUp() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => signingUp,
    () => signingUp
  );
}
