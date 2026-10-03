import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserProfile } from '../services/userService';

// Reads the current user's role from Firestore. Every mobile-registered
// account is hardcoded to "resident" (see authService.registerUser),
// but admin accounts created via Kgahlisho's website may have
// role: "admin" in that same users collection — same backend, so this
// works without any separate login system.
export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    getUserProfile(user.uid)
      .then((profile) => setRole(profile?.role ?? 'resident'))
      // Offline or refused: treat as a regular member until it loads.
      .catch(() => setRole('resident'))
      .finally(() => setLoading(false));
  }, [user]);

  return { role,
    loading,
    isAdmin: role === 'admin', // only two roles now: resident, admin
    canCheckIn: role === 'admin'// admin does both approval AND check-in
};
}