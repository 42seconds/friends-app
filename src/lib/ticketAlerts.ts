import { PurchasedTicket } from '../types';

// What changed for this booking that the person should hear about.
export function alertFor(t: PurchasedTicket, before: string | undefined) {
  const event = t.eventTitle ?? 'your event';
  if (t.status === 'confirmed' && before !== 'confirmed') {
    return { title: 'Your tickets are ready 🎉', body: `Payment approved for ${event}. Tap to see your QR.`, url: `/ticket/${t.id}` };
  }
  if (t.status === 'rejected' && before !== 'rejected') {
    return { title: 'Your proof needs a quick fix', body: `${t.rejection?.reason ?? "We couldn't confirm your payment"}. Your tickets are still held for ${event}.`, url: `/purchase/rejected?ticketId=${t.id}` };
  }
  return null;
}
