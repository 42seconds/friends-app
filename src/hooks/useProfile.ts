import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserProfile } from '../services/userService';
import { UserProfile } from '../types';
import { readCache, writeCache } from '../lib/offlineCache';

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    // Saved copy first so names and settings show instantly offline.
    const saved = await readCache<UserProfile>(`profile:${user.uid}`);
    if (saved) {
      setProfile(saved);
      setLoading(false);
    }
    const p = await getUserProfile(user.uid).catch(() => undefined);
    if (p) writeCache(`profile:${user.uid}`, p);
    if (p !== undefined || !saved) setProfile(p ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { profile, loading, reload, user };
}

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
