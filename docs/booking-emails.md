# Booking emails

From the "Emails" designs (78 Emails in the &FRIENDS App Redesign canvas),
sent through EmailJS (free plan) with one template,
[`emailjs-booking-template.html`](emailjs-booking-template.html):

| Email | Sent when |
|---|---|
| **Held for you** · "Your tickets are held for 24 hours" | Someone reserves tickets: amount, bank details, reference, when the hold ends, and an "Upload proof of payment" button. |
| **You're in!** · "Your tickets are ready" | Staff approve the payment in the app's staff mode, or straight away for a free guest-list code. |
| **Quick fix needed** · "Action needed: your proof needs a fix" | Staff reject a proof in the app, with the reason they picked. |

Buttons open the web app (https://42seconds.github.io/friends-app/). The
emails go to the email on the booking. Approving or rejecting on the admin
website doesn't send them (only the app sends emails).

## Switch them on (about 3 minutes)

EmailJS's free plan allows two templates: one for the codes, one for these.

1. emailjs.com → **Email Templates → Create New Template**.
2. **Content → Edit Content → Code Editor**: paste
   `docs/emailjs-booking-template.html`.
3. **Subject:** `{{subject}}`. On the right: **To Email** `{{email}}`,
   **From Name** `&FRIENDS`. Save and copy the **Template ID**.
4. Put it in `app.json` → `expo.extra.emailjs.bookingTemplateId` and push.

Until a template ID is there, no booking emails are sent (everything else
works as normal).

The bank details in the "held" email come from `src/config/payment.ts`;
replace the placeholders with the real &FRIENDS account before launch.
