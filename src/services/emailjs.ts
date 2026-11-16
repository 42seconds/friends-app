import { EMAILJS } from '../config/emailCodes';

// Sends an email through EmailJS (emailjs.com, free plan): the app posts
// the template's values and EmailJS's Gmail connection sends it. Used for
// the demo code emails and the booking emails.
export class EmailSendError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

export async function sendEmailJs(templateId: string, params: Record<string, string>) {
  if (!EMAILJS.serviceId || !EMAILJS.publicKey || !templateId) throw new EmailSendError('EmailJS is not set up');
  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ service_id: EMAILJS.serviceId, template_id: templateId, user_id: EMAILJS.publicKey, template_params: params }),
  }).catch(() => null);
  if (!res) throw new EmailSendError('offline');
  if (!res.ok) {
    const why = await res.text().catch(() => '');
    console.warn('EmailJS refused the email:', res.status, why);
    throw new EmailSendError(why || 'refused', res.status);
  }
}
