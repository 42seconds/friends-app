import { bookingLabel, cartCount, cartFromParams, cartLines, cartParams, linesSummary, maxFor, quoteLines, setCartQty } from '../src/lib/booking';
import { allSoldOut, isEarlyBird, tierBadges, tierState } from '../src/lib/tiers';
import { Event, TicketTier } from '../src/types';

const GA: TicketTier = { tier: 'General Admission', price: 150, available: true };
const VIP: TicketTier = { tier: 'VIP', price: 300, available: true };
const event = { id: 'e1', tickets: [GA, VIP] } as Event;
const NOW = new Date('2026-11-16T12:00:00').getTime();

describe('booking several ticket types', () => {
  it('holds a number per ticket type and drops zeros', () => {
    let c = setCartQty({}, 'General Admission', 1);
    c = setCartQty(c, 'VIP', 2);
    expect(c).toEqual({ 'General Admission': 1, VIP: 2 });
    expect(cartCount(c)).toBe(3);
    expect(setCartQty(c, 'VIP', 0)).toEqual({ 'General Admission': 1 });
  });

  it('keeps the total within 4 per person, across types', () => {
    const c = { 'General Admission': 3 };
    expect(maxFor(c, 'VIP')).toBe(1);
    expect(maxFor(c, 'General Admission')).toBe(4);
    expect(maxFor({}, 'VIP', 4, 2)).toBe(2); // only 2 left of that type
  });

  it('survives the trip through a link, and reads older single-type links', () => {
    const c = { 'General Admission': 1, 'VIP & Friends': 2 };
    const params = Object.fromEntries(new URLSearchParams(cartParams('e1', c)));
    expect(cartFromParams(params)).toEqual(c);
    expect(cartFromParams({ tier: 'VIP', qty: '2' })).toEqual({ VIP: 2 });
    expect(cartFromParams({ items: 'not json' })).toEqual({});
  });

  it('prices every line together', () => {
    const lines = cartLines(event, { 'General Admission': 1, VIP: 2 });
    expect(lines.map((l) => l.qty)).toEqual([1, 2]);
    expect(quoteLines(lines).subtotal).toBe(750);
    expect(linesSummary(lines)).toBe('1 × General Admission, 2 × VIP');
  });

  it('leaves out ticket types that sold out meanwhile', () => {
    const e = { id: 'e1', tickets: [GA, { ...VIP, available: false }] } as Event;
    expect(cartLines(e, { 'General Admission': 1, VIP: 2 }).map((l) => l.tier.tier)).toEqual(['General Admission']);
  });

  it('labels old and new bookings the same way', () => {
    expect(bookingLabel({ tier: 'General Admission', quantity: 2 })).toBe('2 × General Admission');
    expect(bookingLabel({ tier: '1 × GA, 2 × VIP', quantity: 3, items: [{ tier: 'GA', qty: 1 }, { tier: 'VIP', qty: 2 }] })).toBe('1 × GA, 2 × VIP');
  });
});

describe('ticket type states', () => {
  it('sold out when switched off or none left', () => {
    expect(tierState({ ...GA, available: false }, NOW)).toBe('sold_out');
    expect(tierState({ ...GA, remaining: 0 }, NOW)).toBe('sold_out');
    expect(tierState(GA, NOW)).toBe('on_sale');
  });

  it('early bird: spotted by name or flag, ends after its date', () => {
    const eb: TicketTier = { tier: 'Early Bird', price: 100, available: true, salesEnd: '2026-11-15' };
    expect(isEarlyBird(eb)).toBe(true);
    expect(isEarlyBird({ ...GA, earlyBird: true })).toBe(true);
    expect(tierState(eb, NOW)).toBe('ended');
    expect(tierState({ ...eb, salesEnd: '2026-11-16' }, NOW)).toBe('on_sale'); // until the end of that day
    expect(tierBadges(eb, NOW).map((b) => b.label)).toEqual(['Early bird over']);
  });

  it('shows "ends today" and low stock', () => {
    const t: TicketTier = { tier: 'Early Bird', price: 100, available: true, salesEnd: '2026-11-16', remaining: 8 };
    expect(tierBadges(t, NOW).map((b) => b.label)).toEqual(['Early bird', 'Ends today', 'Only 8 left']);
  });

  it('the event counts as sold out when every type is gone', () => {
    expect(allSoldOut([{ ...GA, available: false }, { ...VIP, remaining: 0 }], NOW)).toBe(true);
    expect(allSoldOut([GA, { ...VIP, available: false }], NOW)).toBe(false);
    expect(allSoldOut([], NOW)).toBe(false);
  });
});
