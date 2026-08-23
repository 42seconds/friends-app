import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';

// Shape of what this context will expose to the rest of the app.
// Any screen that calls useAuth() gets exactly these two things back.
interface AuthContextType {
  user: User | null;   // null = nobody logged in, otherwise the Firebase user object
  loading: boolean;    // true while Firebase is still checking auth state on app start
}

// Create the context with default values (used only if a component
// tries to read it outside of AuthProvider — shouldn't normally happen).
const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

// This component wraps the ENTIRE app (we'll do that in _layout.tsx next).
// Its job: talk to Firebase once, then hand the result down to everyone else.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // React state — when these change, every screen using useAuth() re-renders automatically.
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // useEffect with an empty [] dependency array = runs ONCE when the app first mounts.
  useEffect(() => {
    // onAuthStateChanged is a Firebase listener — it fires:
    //   1. immediately, with whatever the current logged-in state is
    //   2. again, any time the user logs in or logs out anywhere in the app
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);        // u is either a Firebase User object or null
      setLoading(false); // we now know the real auth state, stop showing "loading"
    });

    // Cleanup function — React calls this if AuthProvider ever unmounts,
    // so the listener doesn't keep running in the background forever.
    return unsub;
  }, []);

  // Makes { user, loading } available to every child component in the app,
  // via the useAuth() hook below.
  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Shortcut hook — instead of every screen writing useContext(AuthContext),
// they just write useAuth(). Purely for convenience/readability.
export const useAuth = () => useContext(AuthContext);