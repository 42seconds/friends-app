// Seeds Firestore with sample &FRIENDS data so every collection has at
// least 10 documents.
//
// Run on your own computer (never in CI):
//   node scripts/seed.mjs --key ../serviceAccount.json --dry-run   (shows what it would add)
//   node scripts/seed.mjs --key ../serviceAccount.json             (adds it)
//
// - The key is a Firebase service account key. It gives full access to
//   the project: keep it outside this folder and never commit it.
// - Existing documents are never changed or deleted. Each collection is
//   only topped up to the target count.
// - Seeded documents use fixed "seed_" ids and carry seeded: true, so
//   re-running doesn't duplicate them and they're easy to find later.

import { readFileSync } from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const args = process.argv.slice(2);
const keyPath = args[args.indexOf('--key') + 1];
const dryRun = args.includes('--dry-run');
const TARGET = 10;

// FIRESTORE_EMULATOR_HOST set = practice run against the local emulator.
const emulator = !!process.env.FIRESTORE_EMULATOR_HOST;
if (!emulator && (!args.includes('--key') || !keyPath)) {
  console.error('Usage: node scripts/seed.mjs --key <path to serviceAccount.json> [--dry-run]');
  process.exit(1);
}

initializeApp(emulator ? { projectId: 'demo-friends' } : { credential: cert(JSON.parse(readFileSync(keyPath, 'utf8'))) });
const db = getFirestore();

// ---- helpers --------------------------------------------------------------

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const daysFromNow = (n) => new Date(Date.now() + n * 86400000);
// Same format the admin website saves: "Tue, 24 November 2026".
const eventDate = (d) => `${DAYS[d.getDay()].slice(0, 3)}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
const iso = (d) => d.toISOString();
const round2 = (n) => Math.round(n * 100) / 100;

// Same all-in pricing as src/config/pricing.ts: +5% fee, then +15% VAT.
function price(face, qty) {
  const subtotal = face * qty;
  const serviceFee = round2(subtotal * 0.05);
  const vat = round2((subtotal + serviceFee) * 0.15);
  return { subtotal, serviceFee, vat, discount: 0, totalPrice: round2(subtotal + serviceFee + vat) };
}

const seeded = { seeded: true };

// ---- sample data -----------------------------------------------------------

const PEOPLE = [
  ['Thabo Mokoena', '+27821234501', ['music', 'fun']],
  ['Lerato Dlamini', '+27731234502', ['talk', 'food']],
  ['Sipho Nkosi', '+27611234503', ['music']],
  ['Naledi Khumalo', '+27841234504', ['food', 'fun']],
  ['Kagiso Molefe', '+27721234505', ['talk']],
  ['Zanele Mthembu', '+27831234506', ['music', 'talk']],
  ['Pieter van Wyk', '+27791234507', ['fun']],
  ['Ayesha Patel', '+27601234508', ['food', 'music']],
  ['Bongani Zulu', '+27811234509', ['music', 'fun', 'food']],
  ['Refilwe Sithole', '+27741234510', ['talk', 'fun']],
];

const users = PEOPLE.map(([name, phone, interests], i) => ({
  id: `seed_user_${String(i + 1).padStart(2, '0')}`,
  data: {
    name,
    email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`,
    phone,
    role: 'resident',
    interests,
    createdAt: iso(daysFromNow(-60 + i * 3)),
    ...seeded,
  },
}));

const EVENTS = [
  ['Braam After Dark', 'Live Music', 'Kitcheners Carvery Bar', 'Three local bands, one long night on De Korte Street.', 120, 250, 12],
  ['Rooftop Sessions', 'Live Music', 'Braamfontein Rooftop', 'Sunset DJ sets above the city.', 150, 300, 19],
  ['Ideas on Juta', 'Talk', 'Wits Art Museum', 'A panel on building creative businesses in Joburg.', 0, 0, 9],
  ['Book Club: New SA Fiction', 'Book club', 'Bridge Books', 'Monthly read and discussion. Snacks on us.', 50, 0, 15],
  ['Games Night', 'Games night', 'The Mix Juta Street', 'Board games, trivia and a lot of shouting.', 80, 0, 6],
  ['Neighbourgoods Late', 'Food market', 'Neighbourgoods Market', 'The Saturday market, after dark.', 60, 0, 13],
  ['Pop-up Supper Club', 'Food pop-up', 'Lamunu Hotel', 'A five-course long table with a guest chef.', 450, 0, 22],
  ['Comedy in Braam', 'Social', 'Joburg Theatre Studio', 'Stand-up from five rising comics.', 100, 180, 27],
  ['Amapiano Sunday', 'Live Music', 'Constitution Hill', 'Daytime amapiano with food trucks.', 200, 400, 33],
  ['Founders & Friends', 'Panel', 'Tshimologong Precinct', 'Startup founders on what they would do differently.', 0, 0, 40],
];

const events = EVENTS.map(([title, tag, location, description, ga, vip, inDays], i) => {
  const tickets = [{ tier: 'General Admission', price: ga, available: true }];
  if (vip) tickets.push({ tier: 'VIP', price: vip, available: true });
  return {
    id: `seed_event_${String(i + 1).padStart(2, '0')}`,
    data: {
      title,
      tag,
      location,
      description,
      date: eventDate(daysFromNow(inDays)),
      time: '19:00 - 23:00',
      status: 'published',
      featured: i === 0,
      image: `https://picsum.photos/seed/andfriends${i + 1}/800/600`,
      lineup: [],
      tickets,
      createdAt: iso(daysFromNow(-20 + i)),
      ...seeded,
    },
  };
});

// Tickets, waitlist entries and ratings point at real events: the
// published events already in Firestore, plus any sample events added.
function relatedDocs(pool) {
// A spread of booking states, so every screen has something to show.
const STATES = ['confirmed', 'confirmed', 'confirmed', 'pending_verification', 'pending_verification', 'pending_payment', 'confirmed', 'rejected', 'confirmed', 'pending_payment'];

const tickets = STATES.map((status, i) => {
  const user = users[i];
  const event = pool[i % pool.length];
  const tier = event.data.tickets?.[0] ?? { tier: 'General Admission', price: 100 };
  const quantity = (i % 3) + 1;
  const created = daysFromNow(-5 + i * 0.25);
  const t = {
    userId: user.id,
    userName: user.data.name,
    userEmail: user.data.email,
    eventId: event.id,
    eventTitle: event.data.title,
    eventDate: event.data.date,
    eventTime: event.data.time,
    eventLocation: event.data.location,
    // Website events store images inline; keep tickets small.
    eventImage: String(event.data.image ?? '').startsWith('http') ? event.data.image : '',
    tag: event.data.tag ?? '',
    tier: tier.tier,
    price: tier.price,
    quantity,
    ...price(tier.price, quantity),
    status,
    proofOfPayment: status === 'pending_payment' ? '' : 'seeded-proof',
    qrCode: '',
    createdAt: iso(created),
    // Pending holds get a fresh 24-hour window from now.
    holdExpiresAt: iso(status === 'pending_payment' ? daysFromNow(1) : new Date(created.getTime() + 86400000)),
    ...seeded,
  };
  t.total = t.totalPrice;
  if (status !== 'pending_payment') t.proofUploadedAt = iso(new Date(created.getTime() + 3600000));
  if (status === 'confirmed') Object.assign(t, { validated: true, validatedAt: iso(new Date(created.getTime() + 7200000)) });
  if (status === 'rejected') t.rejection = { reason: 'Wrong amount', message: `The amount doesn't match R${t.totalPrice.toFixed(2)}. Please upload the right proof.`, keepHeld: true, at: iso(new Date(created.getTime() + 7200000)) };
  return { id: `TKT-SEED${String(i + 1).padStart(4, '0')}`, data: t };
});

const waitlist = users.map((u, i) => {
  const event = pool[(i + 1) % Math.min(3, pool.length)]; // a few popular events
  return {
    id: `${event.id}_${u.id}`,
    data: { eventId: event.id, userId: u.id, userName: u.data.name, quantity: (i % 2) + 1, whatsappAlerts: i % 2 === 0, joinedAt: iso(daysFromNow(-3 + i * 0.2)), ...seeded },
  };
});

const HIGHLIGHTS = ['Music', 'Crowd', 'Venue', 'Food', 'Staff'];
const FIXES = ['', 'Bar queue was long.', '', 'Sound was a bit loud at the back.', '', '', 'More seating please.', '', 'Started late.', ''];
const ratings = users.map((u, i) => ({
  id: `seed_rating_${String(i + 1).padStart(2, '0')}`,
  data: { eventId: pool[i % pool.length].id, userId: i % 3 === 0 ? null : u.id, stars: [5, 4, 5, 3, 4, 5, 4, 2, 5, 4][i], highlights: HIGHLIGHTS.slice(0, (i % 3) + 1), fix: FIXES[i], anonymous: i % 3 === 0, createdAt: iso(daysFromNow(-10 + i)), ...seeded },
}));

return { tickets, waitlist, ratings };
}

const TYPES = ['Live music', 'Talk or panel', 'Party or social', 'Food pop-up'];
const SPACES = ['Main floor', 'Rooftop', 'Gallery room', 'Not sure yet'];
const enquiries = users.map((u, i) => ({
  id: `seed_enquiry_${String(i + 1).padStart(2, '0')}`,
  data: { userId: u.id, name: u.data.name, email: u.data.email, company: i % 2 ? `${u.data.name.split(' ')[1]} Studio` : '', type: TYPES[i % 4], space: SPACES[i % 4], date: eventDate(daysFromNow(30 + i * 5)), guests: String(40 + i * 20), vibe: 'An evening event for about our community, with a short programme and food.', status: 'received', createdAt: iso(daysFromNow(-8 + i)), ...seeded },
}));

const PROMOS = [['BRAAMFAM', 10], ['WITS20', 20], ['EARLYBIRD', 15], ['FRIENDS5', 5], ['ROOFTOP', 10], ['BOOKCLUB', 25], ['FOUNDERS', 50], ['GAMES10', 10], ['SUPPER15', 15], ['AMAPIANO', 10]];
const promoCodes = PROMOS.map(([code, percentOff], i) => ({
  id: code,
  data: { percentOff, active: i !== 9, ...(i === 6 ? { eventId: events[9].id } : {}), createdAt: iso(daysFromNow(-30)), ...seeded },
}));

// ---- run --------------------------------------------------------------------

console.log(dryRun ? 'DRY RUN: nothing will be written.\n' : '');
let added = 0;

// Tops a collection up to TARGET docs. `all` writes every doc regardless
// (used for the sample people, since sample tickets belong to them).
async function topUp(name, docs, all = false) {
  const existing = (await db.collection(name).count().get()).data().count;
  const need = all ? docs.length : Math.max(0, TARGET - existing);
  const batch = db.batch();
  let n = 0;
  for (const d of docs) {
    if (n >= need) break;
    const ref = db.collection(name).doc(d.id);
    if ((await ref.get()).exists) continue; // already seeded earlier
    batch.set(ref, d.data);
    n++;
  }
  if (!dryRun && n) await batch.commit();
  added += n;
  console.log(`${name.padEnd(11)} had ${String(existing).padStart(3)}  ${dryRun ? 'would add' : 'added'} ${n}  → ${existing + n}`);
}

await topUp('users', users, true);
await topUp('events', events);
const published = (await db.collection('events').where('status', '==', 'published').get()).docs.map((d) => ({ id: d.id, data: d.data() }));
// In a dry run the sample events aren't written, so count them in.
const pool = published.length ? published : events;
const related = relatedDocs(pool);
await topUp('tickets', related.tickets);
await topUp('waitlist', related.waitlist);
await topUp('ratings', related.ratings);
await topUp('enquiries', enquiries);
await topUp('promoCodes', promoCodes);
console.log(`\n${dryRun ? 'Would add' : 'Added'} ${added} documents.`);
