import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { parseSavedUser, savedUserKey } from '../lib/savedUser';

// How long the splash waits for Firebase before using the saved login.
const STARTUP_WAIT_MS = 1500;
// Remembers "Just browsing for now", so a guest who reopens the app
// (even offline) goes straight back to the events.
const BROWSING_KEY = 'nightBrowsing';

interface AuthContextType {
  user: User | null; // null = nobody logged in, otherwise the Firebase user object
  loading: boolean; // true while Firebase is still checking auth state on app start
  browsing: boolean; // "Just browsing for now": explore without an account
  setBrowsing: (b: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, browsing: false, setBrowsing: () => {} });

// Wraps the ENTIRE app (see app/_layout.tsx): talks to Firebase once,
// then hands the result down to everyone else.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [browsing, setBrowsingState] = useState(false);
  const [browsingLoaded, setBrowsingLoaded] = useState(false);
  const setBrowsing = (b: boolean) => {
    setBrowsingState(b);
    AsyncStorage.setItem(BROWSING_KEY, b ? 'true' : 'false').catch(() => {});
  };

  useEffect(() => {
    let answered = false;
    AsyncStorage.getItem(BROWSING_KEY)
      .then((v) => v === 'true' && setBrowsingState(true))
      .catch(() => {})
      .finally(() => setBrowsingLoaded(true));
    // Fires once Firebase knows who is logged in, then on every login/logout.
    const unsub = onAuthStateChanged(auth, (u) => {
      answered = true;
      setUser(u);
      if (u) setBrowsing(false);
      setLoading(false);
    });

    // With a saved login, Firebase checks it with Google's servers before
    // answering. On a slow or missing connection (or a day later, when the
    // token must be refreshed first) that can take a minute, and the app
    // sat on the splash. So after a moment we carry on with the saved
    // login; Firebase corrects it (e.g. logs out) when it answers.
    const timer = setTimeout(async () => {
      if (answered) return;
      const saved = Platform.OS === 'web' ? null
        : parseSavedUser(await AsyncStorage.getItem(savedUserKey(auth.app.options.apiKey ?? '', auth.app.name)).catch(() => null));
      if (answered) return;
      if (saved) setUser(saved);
      setLoading(false);
    }, STARTUP_WAIT_MS);

    return () => {
      unsub();
      clearTimeout(timer);
    };
  }, []);

  return <AuthContext.Provider value={{ user, loading: loading || !browsingLoaded, browsing, setBrowsing }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
