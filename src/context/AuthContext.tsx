import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';

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
  const [browsing, setBrowsing] = useState(false);

  useEffect(() => {
    // Fires immediately with the current state, then on every login/logout.
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) setBrowsing(false);
      setLoading(false);
    });
    return unsub;
  }, []);

  return <AuthContext.Provider value={{ user, loading, browsing, setBrowsing }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
