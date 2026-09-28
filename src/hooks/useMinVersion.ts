import { useEffect, useState } from 'react';
import Constants from 'expo-constants';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

function older(a: string, b: string) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) < (pb[i] ?? 0);
  }
  return false;
}

// True when config/app.minVersion (set by the team) is newer than this
// build. Fails open: no config or no signal never blocks the app.
export function useUpdateRequired() {
  const [required, setRequired] = useState(false);
  useEffect(() => {
    const current = Constants.expoConfig?.version ?? '0.0.0';
    getDoc(doc(db, 'config', 'app'))
      .then((snap) => {
        const min = snap.exists() ? (snap.data().minVersion as string | undefined) : undefined;
        if (min && older(current, min)) setRequired(true);
      })
      .catch(() => {});
  }, []);
  return required;
}
