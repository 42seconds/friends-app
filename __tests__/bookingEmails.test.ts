import fs from 'fs';
import path from 'path';
import { bookingEmail } from '../src/services/bookingEmails';
import { PurchasedTicket } from '../src/types';

const ticket = {
  id: 'TKT-7Q2M9XKD',
  userId: 'u1',
  userName: 'Jane Doe',
  userEmail: 'jane@example.com',
  eventId: 'e1',
  eventTitle: 'Braam After Dark',
  eventDate: 'Fri, 12 June 2026',
  eventTime: '20:00',
  eventLocation: 'The Venue, Braamfontein',
  tier: '1 × General, 1 × VIP <b>',
  quantity: 2,
  items: [
    { tier: 'General', qty: 1, price: 150 },
    { tier: 'VIP <b>', qty: 1, price: 300 },
  ],
  totalPrice: 543.38,
  status: 'pending_payment',
  proofOfPayment: '',
  qrCode: '',
  createdAt: '2026-06-10T19:32:00.000Z',
  holdExpiresAt: '2026-06-11T19:32:00.000Z',
} as PurchasedTicket;

describe('booking emails', () => {
  it('held: names the person, lists the EFT details and the reference', () => {
    const e = bookingEmail('held', ticket);
    expect(e.subject).toBe('Your tickets are held for 24 hours');
    expect(e.heading).toBe('Held for you, Jane');
    expect(e.body_html).toContain('TKT-7Q2M9XKD');
    expect(e.body_html).toContain('R543.38');
    expect(e.body_html).toContain('1 × General, 1 × VIP');
    expect(e.button_url).toContain('/purchase/pay?ticketId=TKT-7Q2M9XKD');
  });

  it("you're in: event details and a link to the ticket", () => {
    const e = bookingEmail('confirmed', { ...ticket, status: 'confirmed' });
    expect(e.subject).toBe("You're in! Your tickets are ready");
    expect(e.body_html).toContain('Payment approved.');
    expect(e.body_html).toContain('The Venue, Braamfontein');
    expect(e.button_url).toContain('/ticket/TKT-7Q2M9XKD');
    expect(bookingEmail('confirmed', { ...ticket, totalPrice: 0 }).body_html).toContain('guest list');
  });

  it('needs a fix: shows the reason staff gave', () => {
    const e = bookingEmail('fix', { ...ticket, status: 'rejected', rejection: { reason: 'Reference missing', message: 'We can see R543.38 but not the reference.', keepHeld: true, at: '' } });
    expect(e.subject).toBe('Action needed: your proof needs a fix');
    expect(e.body_html).toContain('still held');
    expect(e.body_html).toContain('Reference missing');
  });

  it('never lets names break the email (HTML is escaped)', () => {
    const e = bookingEmail('held', ticket);
    expect(e.body_html).not.toContain('VIP <b>');
    expect(e.body_html).toContain('VIP &lt;b&gt;');
  });

  // Writes filled-in previews when asked: EMAIL_PREVIEW_DIR=... npx jest bookingEmails
  it('previews', () => {
    const dir = process.env.EMAIL_PREVIEW_DIR;
    if (!dir) return;
    const tpl = fs.readFileSync(path.join(__dirname, '../docs/emailjs-booking-template.html'), 'utf8');
    const fill = (v: Record<string, string>) => tpl.replace(/\{\{\{(\w+)\}\}\}|\{\{(\w+)\}\}/g, (_, a, b) => v[a ?? b] ?? '');
    const clean = { ...ticket, tier: '1 × General, 1 × VIP', items: [{ tier: 'General', qty: 1 }, { tier: 'VIP', qty: 1 }] } as PurchasedTicket;
    fs.writeFileSync(path.join(dir, 'held.html'), fill(bookingEmail('held', clean)));
    fs.writeFileSync(path.join(dir, 'confirmed.html'), fill(bookingEmail('confirmed', { ...clean, status: 'confirmed' })));
    fs.writeFileSync(path.join(dir, 'fix.html'), fill(bookingEmail('fix', { ...clean, status: 'rejected', rejection: { reason: 'Reference missing', message: 'We can see R543.38, but not TKT-7Q2M9XKD. A screenshot from your banking app works too.', keepHeld: true, at: '' } })));
  });
});
