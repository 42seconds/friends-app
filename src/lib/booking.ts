import { Linking } from 'react-native';
import { BookingItem, Event, PurchasedTicket, TicketTier } from '../types';
import { MAX_TICKETS_PER_PERSON } from '../config/pricing';
import { tierState } from './tiers';
import { effectiveStatus } from './tickets';
import { breakdown } from './pricing';
import { parseEventDate } from './dates';

// A booking can hold several ticket types (one QR admits the whole
// booking): the cart maps each ticket type to how many.
export type Cart = Record<string, number>;

export interface Selection {
  tier: string;
  qty: number;
}

export function cartCount(cart: Cart) {
  return Object.values(cart).reduce((n, q) => n + (q > 0 ? q : 0), 0);
}

export function setCartQty(cart: Cart, tier: string, qty: number): Cart {
  const next = { ...cart };
  if (qty > 0) next[tier] = qty;
  else delete next[tier];
  return next;
}

// How many of this type can still be added within the per-person limit.
export function maxFor(cart: Cart, tier: string, limit = MAX_TICKETS_PER_PERSON, remaining?: number) {
  const room = limit - (cartCount(cart) - (cart[tier] ?? 0));
  return Math.max(0, typeof remaining === 'number' ? Math.min(room, remaining) : room);
}

export function cartParams(eventId: string, cart: Cart, extra: Record<string, string> = {}) {
  const clean = Object.fromEntries(Object.entries(cart).filter(([, q]) => q > 0));
  return new URLSearchParams({ eventId, items: JSON.stringify(clean), ...extra }).toString();
}

// One ticket type (waitlist offers, older links).
export function selectionParams(eventId: string, sel: Selection, extra: Record<string, string> = {}) {
  return cartParams(eventId, { [sel.tier]: sel.qty }, extra);
}

// Reads the cart back from a link: ?items={...}, or the older ?tier=&qty=.
export function cartFromParams(p: { items?: string; tier?: string; qty?: string }): Cart {
  if (p.items) {
    try {
      const raw = JSON.parse(p.items) as Record<string, unknown>;
      const cart: Cart = {};
      for (const [tier, q] of Object.entries(raw)) {
        const n = Math.floor(Number(q));
        if (tier && n > 0) cart[tier] = n;
      }
      return cart;
    } catch {
      return {};
    }
  }
  if (p.tier) return { [p.tier]: Math.max(1, Math.floor(Number(p.qty ?? 1)) || 1) };
  return {};
}

export interface CartLine {
  tier: TicketTier;
  qty: number;
}

// The cart's ticket types that are still on sale, in the event's order.
export function cartLines(event: Event | null, cart: Cart, now = Date.now()): CartLine[] {
  return (event?.tickets ?? []).filter((t) => (cart[t.tier] ?? 0) > 0 && tierState(t, now) === 'on_sale').map((t) => ({ tier: t, qty: cart[t.tier] }));
}

export function quoteLines(lines: CartLine[], percentOff = 0) {
  return breakdown(lines.reduce((sum, l) => sum + l.tier.price * l.qty, 0), percentOff);
}

// "2 × General Admission, 1 × VIP"
export function linesSummary(lines: { qty: number; tier: string | TicketTier }[]) {
  return lines.map((l) => `${l.qty} × ${typeof l.tier === 'string' ? l.tier : l.tier.tier}`).join(', ');
}

// "2 × General" or "1 × General, 2 × VIP" for any booking.
export function bookingLabel(t: Pick<PurchasedTicket, 'items' | 'tier' | 'quantity' | 'price'>) {
  return linesSummary(bookingItems(t));
}

// Short line for tight spaces: "2 × General Admission" or "3 tickets · 2 types".
export function cartShort(lines: CartLine[]) {
  if (lines.length <= 1) return linesSummary(lines);
  const n = lines.reduce((sum, l) => sum + l.qty, 0);
  return `${n} tickets · ${lines.length} types`;
}

// The ticket types in a booking (older bookings have just one).
export function bookingItems(t: Pick<PurchasedTicket, 'items' | 'tier' | 'quantity' | 'price'>): BookingItem[] {
  return t.items?.length ? t.items : [{ tier: t.tier, qty: t.quantity, price: t.price }];
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

// Where a booking row should take the user, by state.
export function bookingHref(t: PurchasedTicket) {
  switch (effectiveStatus(t)) {
    case 'pending_payment':
      return `/purchase/pay?ticketId=${t.id}`;
    case 'pending_verification':
      return `/purchase/awaiting?ticketId=${t.id}`;
    case 'rejected':
      return `/purchase/rejected?ticketId=${t.id}`;
    case 'expired':
      return `/purchase/expired?ticketId=${t.id}`;
    default:
      return `/ticket/${t.id}`;
  }
}

