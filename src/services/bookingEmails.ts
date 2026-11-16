import { EMAILJS } from '../config/emailCodes';
import { bankDetails } from '../config/payment';
import { HOLD_HOURS } from '../config/pricing';
import { PurchasedTicket } from '../types';
import { bookingLabel } from '../lib/booking';
import { shortDate } from '../lib/dates';
import { rand } from '../lib/pricing';
import { sendEmailJs } from './emailjs';

// The booking emails from the "Emails" designs (78 Emails in the &FRIENDS
// App Redesign canvas), sent through EmailJS with one template
// (docs/emailjs-booking-template.html):
//   held       "Your tickets are held for 24 hours"  (after reserving)
//   confirmed  "You're in! Your tickets are ready"    (approved, or a free guest-list code)
//   fix        "Action needed: your proof needs a fix" (proof rejected)
export type BookingEmailKind = 'held' | 'confirmed' | 'fix';

// Where the buttons go: the web version of the app.
export const APP_URL = 'https://42seconds.github.io/friends-app';

const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const FONT = "font-family:'Instrument Sans',Helvetica,Arial,sans-serif;";
const MONO = "font-family:'JetBrains Mono',Menlo,Consolas,'Courier New',monospace;";

function para(html: string) {
  return `<p style="margin:0 0 16px;${FONT}font-size:15px;line-height:1.55;color:#3A362F;">${html}</p>`;
}

// The light grey box of label / value rows.
function rows(items: [string, string, boolean?][]) {
  const cells = items
    .map(([k, v, mono], i) => {
      const line = i < items.length - 1 ? 'border-bottom:1px solid #E6E0D3;' : '';
      return `<tr><td style="padding:10px 14px;${FONT}font-size:14px;color:#5E594F;${line}">${esc(k)}</td><td align="right" style="padding:10px 14px;${mono ? MONO : FONT}font-size:14px;font-weight:700;color:#15130F;${line}">${esc(v)}</td></tr>`;
    })
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#F7F5F0;border-radius:14px;margin:0 0 4px;">${cells}</table>`;
}

function reasonBox(reason: string, message: string) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border:2px solid #C8321C;border-radius:14px;margin:0 0 4px;"><tr><td style="padding:14px 16px;${FONT}">
<div style="font-size:12px;font-weight:700;color:#C8321C;letter-spacing:1px;">REASON</div>
<div style="font-size:15px;font-weight:700;color:#15130F;margin-top:4px;">${esc(reason)}</div>
${message ? `<div style="font-size:14px;line-height:1.5;color:#3A362F;margin-top:6px;">${esc(message)}</div>` : ''}
</td></tr></table>`;
}

function holdEnds(t: PurchasedTicket) {
  if (!t.holdExpiresAt) return `${HOLD_HOURS} hours after reserving`;
  const d = new Date(t.holdExpiresAt);
  return `${shortDate(d.toISOString())}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const firstName = (t: PurchasedTicket) => (t.userName ?? '').trim().split(/\s+/)[0] || '';

// Everything the template needs, for one booking. Pure, so it's tested.
export function bookingEmail(kind: BookingEmailKind, t: PurchasedTicket): Record<string, string> {
  const what = bookingLabel(t);
  const event = t.eventTitle ?? 'your event';
  const name = firstName(t);
  if (kind === 'held') {
    return {
      subject: `Your tickets are held for ${HOLD_HOURS} hours`,
      heading: name ? `Held for you, ${name}` : 'Held for you',
      header_bg: '#15130F',
      header_fg: '#F3F0E8',
      body_html:
        para(`Here's everything you need to pay for <b>${esc(what)}, ${esc(event)}</b>. Use the reference exactly as shown.`) +
        rows([
          ['Amount', rand(t.totalPrice), true],
          ['Bank', bankDetails.bank],
          ['Account name', bankDetails.accountName],
          ['Account', bankDetails.accountNumber, true],
          ['Branch', bankDetails.branchCode, true],
          ['Reference', t.id, true],
          ['Hold ends', holdEnds(t)],
        ]),
      button_label: 'Upload proof of payment',
      button_url: `${APP_URL}/purchase/pay?ticketId=${encodeURIComponent(t.id)}`,
      footer: "Didn't book this? Ignore this email and the hold will lapse on its own.",
    };
  }
  if (kind === 'confirmed') {
    const free = t.totalPrice === 0;
    return {
      subject: "You're in! Your tickets are ready",
      heading: "You're in!",
      header_bg: '#FF4F1A',
      header_fg: '#15130F',
      body_html:
        para(`${free ? "You're on the guest list." : 'Payment approved.'} Your tickets for <b>${esc(event)}</b> are in the app and saved for offline.`) +
        rows([
          ['Event', event],
          ['When', [shortDate(t.eventDate, t.eventTime), t.eventTime && `doors ${t.eventTime}`].filter(Boolean).join(', ')],
          ['Where', t.eventLocation ?? ''],
          ['Tickets', what],
          ['Order', t.id, true],
        ]),
      button_label: 'Open my tickets',
      button_url: `${APP_URL}/ticket/${encodeURIComponent(t.id)}`,
      footer: 'Show the QR code in the app at the door. It works without signal.',
    };
  }
  const r = t.rejection;
  const held = r?.keepHeld !== false;
  return {
    subject: 'Action needed: your proof needs a fix',
    heading: 'Quick fix needed',
    header_bg: '#C8321C',
    header_fg: '#F3F0E8',
    body_html:
      para(held ? `Your tickets are <b>still held</b>. We just couldn't confirm your payment from the proof you sent.` : `We couldn't confirm your payment for <b>${esc(event)}</b>.`) +
      reasonBox(r?.reason ?? 'We need a clearer proof', r?.message ?? `We're looking for ${rand(t.totalPrice)} with the reference ${t.id}. A screenshot from your banking app works too.`),
    button_label: 'Upload a new proof',
    button_url: `${APP_URL}/purchase/rejected?ticketId=${encodeURIComponent(t.id)}`,
    footer: 'No need to pay again. Questions? Reply to this email.',
  };
}

// Sends it in the background: a booking never waits on (or fails
// because of) an email.
export function sendBookingEmail(kind: BookingEmailKind, t: PurchasedTicket | null | undefined) {
  const to = t?.userEmail?.trim();
  if (!t || !to || !EMAILJS.bookingTemplateId) return;
  sendEmailJs(EMAILJS.bookingTemplateId, { ...bookingEmail(kind, t), email: to, to_email: to }).catch(() => {});
}
