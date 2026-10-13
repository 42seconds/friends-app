// Everything the Help page says. Edit the words here; the screen picks
// them up. `steps` render as a numbered list, `go` as a shortcut button.
import { HOLD_HOURS, MAX_TICKETS_PER_PERSON } from '../config/pricing';

export type HelpTopic = 'start' | 'buy' | 'eft' | 'checking' | 'tickets' | 'sending' | 'refunds' | 'account' | 'notifications' | 'trouble';

export interface HelpItem {
  topic: HelpTopic;
  q: string;
  a: string;
  steps?: string[];
  go?: { label: string; href: string };
}

export const SECTIONS: { key: HelpTopic; title: string }[] = [
  { key: 'start', title: 'Getting started' },
  { key: 'buy', title: 'Buying tickets' },
  { key: 'eft', title: 'Paying by EFT' },
  { key: 'checking', title: 'Proof of payment and checking' },
  { key: 'tickets', title: 'Your tickets and the door' },
  { key: 'sending', title: 'Sending tickets and the waitlist' },
  { key: 'refunds', title: 'Refunds' },
  { key: 'account', title: 'Account and password' },
  { key: 'notifications', title: 'Notifications' },
  { key: 'trouble', title: 'Something not working?' },
];

// The four big tiles at the top filter to these sections.
export const TILES: { key: string; label: string; topics: HelpTopic[] }[] = [
  { key: 'eft', label: 'Paying by EFT', topics: ['eft', 'checking'] },
  { key: 'tickets', label: 'My tickets', topics: ['buy', 'tickets', 'sending'] },
  { key: 'refunds', label: 'Refunds', topics: ['refunds'] },
  { key: 'door', label: 'At the door', topics: ['tickets'] },
];

export const FAQ: HelpItem[] = [
  // Getting started
  { topic: 'start', q: 'What is &FRIENDS?', a: "&FRIENDS is Braamfontein's events app: gigs, talks, games nights, markets and food pop-ups, all in one place. You find an event, reserve tickets, pay by EFT, and your QR ticket appears in the app." },
  { topic: 'start', q: 'How do I get my first ticket?', a: 'It takes about a minute in the app, plus your bank transfer.', steps: ['Tap an event on Explore.', `Choose your tickets (up to ${MAX_TICKETS_PER_PERSON}) and tap Reserve.`, `Pay by EFT within ${HOLD_HOURS} hours, using your booking reference.`, 'Upload a screenshot of the payment as proof.', 'We check it and your QR ticket appears in Tickets.'], go: { label: 'Watch the 1-minute guide', href: '/guide?replay=1' } },
  { topic: 'start', q: 'Do I need an account?', a: 'You can browse events without one. To reserve tickets you need an account, so we can hold your tickets and send your QR to you. Sign up with your email or with Continue with Google.' },
  { topic: 'start', q: 'What are &Music, &Talk, &Fun and &Food?', a: 'They are our four kinds of events. Tap one on Explore to only see those events, or follow them in your profile to hear when new ones drop.' },

  // Buying
  { topic: 'buy', q: 'What does "all-in" price mean?', a: "The price you see already includes the service fee and VAT. There's nothing extra at checkout, unless a promo code makes it cheaper." },
  { topic: 'buy', q: 'How many tickets can I buy?', a: `Up to ${MAX_TICKETS_PER_PERSON} per booking, so more people get a chance at popular nights. All the tickets on one booking share one QR code that admits everyone.` },
  { topic: 'buy', q: 'What happens when I tap Reserve?', a: `Your tickets are held for you for ${HOLD_HOURS} hours while you pay. Nobody else can take them. Reserving is free.` },
  { topic: 'buy', q: 'How do promo or access codes work?', a: 'On the Review booking screen, tap "Add promo or access code" and type it in. A valid code shows the discount straight away. Access codes can also unlock hidden ticket types.' },
  { topic: 'buy', q: 'The event says Sold out. Can I still go?', a: "Join the waitlist on the event page. If someone releases a ticket, the next person in line gets 30 minutes to claim it, and we'll tell you by notification (and WhatsApp if you turn it on)." },

  // EFT
  { topic: 'eft', q: 'How do I pay by EFT?', a: 'Use your own banking app. We show you every detail you need on the Pay by EFT screen.', steps: ['Open your booking and tap Pay by EFT.', 'Tap Copy next to each detail: account number, branch code and the amount.', 'In your banking app, choose "Pay once-off" (you don\'t need to save us as a beneficiary).', 'Paste your booking reference into "Their reference" (or "Recipient reference").', 'Pay the exact amount shown, then screenshot the confirmation.'] },
  { topic: 'eft', q: 'Which reference do I use?', a: 'Your booking reference, which looks like TKT-AB12CD34. Put it in "Their reference" or "Recipient reference", not "My reference". That is how we match your payment to your booking.' },
  { topic: 'eft', q: 'Why EFT and not card?', a: 'EFT has no card fees, which keeps ticket prices lower for everyone. Every South African bank app can do an EFT.' },
  { topic: 'eft', q: 'I paid but used the wrong reference', a: "Upload your proof anyway. We also match payments by amount and date, and we'll contact you if we can't find it." },
  { topic: 'eft', q: 'My hold ran out but I already paid', a: 'Open the booking and tap "I already paid, upload proof". Upload your proof and we\'ll sort it out, or refund you if the tickets are gone.' },
  { topic: 'eft', q: 'Can I pay later?', a: `Yes, as long as it's within ${HOLD_HOURS} hours of reserving. Your booking stays in Tickets under Pending with a countdown, so you can pick up where you left off.` },

  // Proof and checking
  { topic: 'checking', q: 'What is proof of payment?', a: 'A screenshot or photo of your bank\'s confirmation screen or payment notification. It must show the amount, your booking reference, a date, and that the payment was successful or paid.' },
  { topic: 'checking', q: 'How do I upload my proof?', a: 'You can upload from the booking right after paying.', steps: ['Open Tickets and tap your pending booking (or tap the banner on Explore).', 'Tap Upload proof of payment.', 'Choose the screenshot, or take a photo of the confirmation.', 'Check it shows the amount and reference, then tap Send proof.'], go: { label: 'Open my tickets', href: '/(tabs)/tickets' } },
  { topic: 'checking', q: 'How long does checking take?', a: "Usually within a few hours during the day. You'll get a notification the moment your QR is ready, and your tickets stay held while we check." },
  { topic: 'checking', q: 'My proof was rejected. What now?', a: "Don't worry, your tickets are still held and you don't need to pay again. Open the booking to see why (for example \"reference missing\" or \"wrong amount\") and upload a new proof." },
  { topic: 'checking', q: 'Can I see where my payment is?', a: 'Yes. Open the booking to see a timeline: tickets reserved, proof received, team checking, and QR ready.' },

  // Tickets and door
  { topic: 'tickets', q: 'Where are my tickets?', a: 'In the Tickets tab. Upcoming shows confirmed tickets with their QR, Pending shows bookings you still need to pay or that we are checking, and Past keeps your history.', go: { label: 'Open my tickets', href: '/(tabs)/tickets' } },
  { topic: 'tickets', q: 'What do I show at the door?', a: 'Open your ticket and show the QR code. Turn your screen brightness up. One QR admits everyone on the booking, so arrive together.' },
  { topic: 'tickets', q: 'Will my ticket work without signal?', a: 'Open your ticket once before you leave home and it stays on your phone. The door team can also find you on the guest list by name or ticket ID.' },
  { topic: 'tickets', q: 'My phone died. Can I still get in?', a: 'Yes. Tell the door team your name. They can find you on the guest list and check you in by ticket ID.' },
  { topic: 'tickets', q: 'Do I need ID?', a: 'Night events are 18+, so bring ID. Daytime and family events say so on the event page.' },

  // Sending and waitlist
  { topic: 'sending', q: 'Can I send a ticket to a friend?', a: 'Yes, from the ticket screen.', steps: ['Open your ticket and tap Send.', "Enter your friend's name and WhatsApp number.", 'Slide to send. They get a link to accept it.'], },
  { topic: 'sending', q: 'Can I cancel a ticket I sent?', a: "Yes, until your friend accepts it. Open the ticket and tap Cancel transfer. Once they've accepted, the ticket is theirs." },
  { topic: 'sending', q: "I can't go anymore. What can I do?", a: 'Open the ticket and tap "Can\'t go". You can send it to a friend, or release it to the waitlist and be refunded when someone claims it.' },
  { topic: 'sending', q: 'How does the waitlist work?', a: 'Join from a sold-out event. You see your place in line. When a ticket is released, the next person gets 30 minutes to claim and pay for it, then it moves on.' },

  // Refunds
  { topic: 'refunds', q: 'Can I get a refund?', a: "Refunds are for cancelled or moved events. Otherwise, release your ticket to the waitlist and you're refunded when someone claims it." },
  { topic: 'refunds', q: 'How do I get my money back?', a: 'Add your refund bank details in Settings so we can pay you. Refunds are paid by EFT to that account.', go: { label: 'Add refund bank details', href: '/settings/bank' } },

  // Account
  { topic: 'account', q: 'I forgot my password', a: "Log out (or open the app logged out), tap \"Forgot password?\" on the login screen and enter your email. We'll send a link to choose a new one. Check your spam folder if it doesn't arrive in a few minutes." },
  { topic: 'account', q: 'I signed up with Google. Do I have a password?', a: 'No. Just tap Continue with Google on the login screen. It works on the installed app.' },
  { topic: 'account', q: 'How do I change my name or phone number?', a: 'Go to Profile, then Settings, then Edit profile. Your email is your login, so it can\'t be changed there.', go: { label: 'Edit profile', href: '/settings/edit-profile' } },
  { topic: 'account', q: 'How do I delete my account?', a: 'Settings, then Delete account. Upcoming tickets are cancelled and this can\'t be undone, so check your tickets first.' },

  // Notifications
  { topic: 'notifications', q: "I didn't get a notification", a: "Check that notifications are on for &FRIENDS in your phone's settings, and in Settings, Notifications in the app. Notifications don't work in the Expo Go preview app on Android, only in the installed app. Your updates also appear in the Inbox (the bell on Explore).", go: { label: 'Notification settings', href: '/settings/notifications' } },
  { topic: 'notifications', q: 'What will you notify me about?', a: 'When your tickets are approved and when a proof needs fixing, plus waitlist updates. Everything also shows in your Inbox (the bell on Explore). You can choose what you get in Settings, Notifications.' },

  // Trouble
  { topic: 'trouble', q: "The app says I'm offline", a: 'Check your Wi-Fi or mobile data. Your tickets you have already opened still work offline. New events, reserving and uploading proof need a connection.' },
  { topic: 'trouble', q: 'The app looks out of date or a screen is stuck', a: 'Close the app fully and open it again. If the app asks you to update, install the latest version so everything works.' },
  { topic: 'trouble', q: 'Something else is wrong', a: 'Message us on WhatsApp or email us below with your booking reference (TKT-…) and a screenshot, and we\'ll help.' },
];

export function searchHelp(query: string, topics?: HelpTopic[]): HelpItem[] {
  const q = query.trim().toLowerCase();
  return FAQ.filter((f) => (!topics || topics.includes(f.topic)) && (!q || [f.q, f.a, ...(f.steps ?? [])].join(' ').toLowerCase().includes(q)));
}
