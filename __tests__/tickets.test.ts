import { toTicket, holdEndsAt, effectiveStatus } from '../src/lib/tickets';

describe('bookings saved by the website', () => {
  // Shape of a real website booking (no status, totalPrice or createdAt).
  const website = { userId: 'u1', eventId: 'e1', price: 300, quantity: 5, total: 1500, validated: false, purchasedAt: '2026-09-16T08:35:49.133Z' };

  it('are read as unpaid bookings with the right total', () => {
    const t = toTicket('TKT-2EIT2Y9Z', website);
    expect(t.status).toBe('pending_payment');
    expect(t.totalPrice).toBe(1500);
    expect(t.createdAt).toBe('2026-09-16T08:35:49.133Z');
  });

  it('are confirmed once validated', () => {
    expect(toTicket('TKT-1', { ...website, validated: true }).status).toBe('confirmed');
  });

  it('never expire, because they had no hold', () => {
    const t = toTicket('TKT-1', website);
    expect(holdEndsAt(t)).toBe(Infinity);
    expect(effectiveStatus(t)).toBe('pending_payment');
  });
});

describe('bookings made in the app', () => {
  it('keep their own status and total', () => {
    const t = toTicket('TKT-2', { status: 'pending_verification', totalPrice: 362.26, total: 362.26, createdAt: '2026-10-01T10:00:00.000Z' });
    expect(t.status).toBe('pending_verification');
    expect(t.totalPrice).toBe(362.26);
  });

  it('expire once the EFT hold runs out', () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    const t = toTicket('TKT-3', { status: 'pending_payment', holdExpiresAt: past });
    expect(effectiveStatus(t)).toBe('expired');
  });

  it('stay on hold while there is time left', () => {
    const later = new Date(Date.now() + 3_600_000).toISOString();
    expect(effectiveStatus(toTicket('TKT-4', { status: 'pending_payment', holdExpiresAt: later }))).toBe('pending_payment');
  });
});
