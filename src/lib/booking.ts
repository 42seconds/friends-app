import { Linking } from 'react-native';
import { Event, TicketTier } from '../types';
import { breakdown } from './pricing';
import { parseEventDate } from './dates';

// A booking is one tier × quantity (one QR admits the whole booking).
export interface Selection {
  tier: string;
  qty: number;
}

export function selectionParams(eventId: string, sel: Selection, extra: Record<string, string> = {}) {
  const q = new URLSearchParams({ eventId, tier: sel.tier, qty: String(sel.qty), ...extra });
  return q.toString();
}

export function findTier(event: Event | null, name?: string): TicketTier | undefined {
  return event?.tickets?.find((t) => t.tier === name);
}

export function quote(tier: TicketTier | undefined, qty: number, percentOff = 0) {
  return breakdown((tier?.price ?? 0) * qty, percentOff);
}

// Opens Google Calendar's "add event" page — works on every phone without
// a native calendar module.
export function addToCalendar(e: Pick<Event, 'title' | 'date' | 'time' | 'location' | 'description'>) {
  const start = parseEventDate(e.date, e.time);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const params = new URLSearchParams({ action: 'TEMPLATE', text: e.title, location: e.location ?? '', details: e.description ?? '' });
  if (start) params.set('dates', `${fmt(start)}/${fmt(new Date(start.getTime() + 4 * 3600 * 1000))}`);
  Linking.openURL(`https://calendar.google.com/calendar/render?${params.toString()}`);
}

export type TravelMode = 'walking' | 'driving' | 'transit';

export function openDirections(destination: string, mode: TravelMode = 'walking') {
  const q = new URLSearchParams({ api: '1', destination, travelmode: mode });
  Linking.openURL(`https://www.google.com/maps/dir/?${q.toString()}`);
}

export function openMap(query: string) {
  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`);
}

export function whatsappLink(text: string, phone?: string) {
  const digits = (phone ?? '').replace(/\D/g, '').replace(/^0/, '27');
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
