import { useBookings } from './useBookings';
import { useAuth } from '../context/AuthContext';
import { coachStore } from '../store';
import { effectiveStatus } from '../lib/tickets';

// The guided first payment runs until the person's first ticket is
// confirmed, or they tap "Hide guide".
export function useFirstTicketGuide() {
  const { user } = useAuth();
  const { tickets, loading } = useBookings();
  const { guideHidden } = coachStore.useStore();
  const hasTicket = tickets.some((t) => effectiveStatus(t) === 'confirmed' || t.checkedIn);
  return !!user && !loading && !guideHidden && !hasTicket;
}
