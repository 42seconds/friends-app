import { Pill } from './night';
import { night } from '../theme/night';
import { TicketStatus } from '../types';

// Status pill for a booking, in Braam Night+ colours.
const STATUS: Record<TicketStatus, { label: string; bg: string; color: string }> = {
  pending_payment: { label: 'AWAITING EFT', bg: night.cream, color: night.ink },
  pending_verification: { label: 'CHECKING', bg: night.amberBg, color: night.ink },
  confirmed: { label: 'CONFIRMED', bg: night.successBg, color: night.success },
  rejected: { label: 'NEEDS A FIX', bg: night.pink, color: night.pinkText },
  expired: { label: 'HOLD EXPIRED', bg: night.sand, color: night.muted },
  cancelled: { label: 'CANCELLED', bg: night.sand, color: night.muted },
};

export default function StatusBadge({ status }: { status: TicketStatus }) {
  const s = STATUS[status] ?? STATUS.pending_payment;
  return <Pill label={s.label} bg={s.bg} color={s.color} mono />;
}
