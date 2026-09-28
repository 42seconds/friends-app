import { useEffect, useState } from 'react';
import { listenToWaitlist, WaitlistEntry } from '../services/communityService';
import { useAuth } from '../context/AuthContext';

export function useWaitlist(eventId?: string) {
  const { user } = useAuth();
  const [state, setState] = useState<{ entry: WaitlistEntry | null; position: number; total: number; loading: boolean }>({ entry: null, position: 0, total: 0, loading: true });
  useEffect(() => {
    if (!eventId || !user) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    return listenToWaitlist(eventId, user.uid, (st) => setState({ ...st, loading: false }));
  }, [eventId, user]);
  return state;
}
