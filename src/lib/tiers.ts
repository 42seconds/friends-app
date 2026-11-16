import { TicketTier } from '../types';
import { parseEventDate, shortDate } from './dates';

// What a ticket type can do right now.
//   on_sale   bookable
//   sold_out  none left (the website switched it off, or remaining is 0)
//   ended     its sales window is over (e.g. early bird after its date)
export type TierState = 'on_sale' | 'sold_out' | 'ended';

export const LOW_STOCK = 20;

export function salesEndDate(t: TicketTier): Date | null {
  if (!t.salesEnd) return null;
  const d = parseEventDate(t.salesEnd);
  if (!d) return null;
  // A date with no time means "until the end of that day".
  if (!/\d{1,2}:\d{2}/.test(t.salesEnd)) d.setHours(23, 59, 59, 999);
  return d;
}

export function tierState(t: TicketTier, now = Date.now()): TierState {
  if (!t.available || t.remaining === 0) return 'sold_out';
  const end = salesEndDate(t);
  if (end && now > end.getTime()) return 'ended';
  return 'on_sale';
}

export function isEarlyBird(t: TicketTier) {
  return !!t.earlyBird || /early[\s-]*bird/i.test(t.tier);
}

// Small labels shown on a ticket type.
export function tierBadges(t: TicketTier, now = Date.now()): { label: string; tone: 'lime' | 'orange' | 'ink' | 'muted' }[] {
  const state = tierState(t, now);
  const out: { label: string; tone: 'lime' | 'orange' | 'ink' | 'muted' }[] = [];
  if (isEarlyBird(t)) out.push({ label: state === 'ended' ? 'Early bird over' : 'Early bird', tone: state === 'ended' ? 'muted' : 'lime' });
  if (state !== 'on_sale') return out;
  const end = salesEndDate(t);
  if (end) {
    const hoursLeft = (end.getTime() - now) / 3600000;
    out.push({ label: hoursLeft <= 48 ? (hoursLeft < 24 ? 'Ends today' : 'Ends tomorrow') : `Until ${shortDate(t.salesEnd)}`, tone: hoursLeft <= 48 ? 'orange' : 'muted' });
  }
  if (typeof t.remaining === 'number' && t.remaining > 0 && t.remaining <= LOW_STOCK) out.push({ label: `Only ${t.remaining} left`, tone: 'orange' });
  return out;
}

// Every ticket type is gone: the event is effectively sold out.
export function allSoldOut(tiers: TicketTier[] | undefined, now = Date.now()) {
  return !!tiers?.length && tiers.every((t) => tierState(t, now) !== 'on_sale');
}
