// Firestore security rules tests. Runs against the local Firestore
// emulator (never the live database): npm run test:rules
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection, query, where, getDocs, deleteField, writeBatch, increment } from 'firebase/firestore';

const env = await initializeTestEnvironment({ projectId: 'demo-friends', firestore: { rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8085 } });
await env.withSecurityRulesDisabled(async (c) => {
  const db = c.firestore();
  await setDoc(doc(db, 'users/admin'), { role: 'admin', name: 'Lebo' });
  await setDoc(doc(db, 'users/jane'), { role: 'resident', name: 'Jane' });
  await setDoc(doc(db, 'events/e1'), { status: 'published', title: 'Braam After Dark' });
  await setDoc(doc(db, 'events/draft'), { status: 'draft' });
  await setDoc(doc(db, 'tickets/TKT-OTHER'), { userId: 'bob', status: 'pending_payment', eventId: 'e1' });
  await setDoc(doc(db, 'promoCodes/BRAAMFAM'), { percentOff: 10, active: true });
  await setDoc(doc(db, 'promoCodes/COMP-GOOD'), { type: 'comp', percentOff: 100, active: true, uses: 0, maxUses: 5 });
  await setDoc(doc(db, 'promoCodes/COMP-OFF'), { type: 'comp', percentOff: 100, active: false, uses: 0 });
  await setDoc(doc(db, 'promoCodes/COMP-FULL'), { type: 'comp', percentOff: 100, active: true, uses: 2, maxUses: 2 });
  await setDoc(doc(db, 'promoCodes/COMP-OLD'), { type: 'comp', percentOff: 100, active: true, uses: 0, expiresAtMs: 1000 });
  await setDoc(doc(db, 'promoCodes/COMP-ONE'), { type: 'comp', percentOff: 100, active: true, uses: 0, maxUses: 1 });
  await setDoc(doc(db, 'promoCodes/COMP-E2'), { type: 'comp', percentOff: 100, active: true, uses: 0, eventId: 'e2' });
  await setDoc(doc(db, 'config/app'), { minVersion: '1.0.0' });
  await setDoc(doc(db, 'otpCodes/verify-email:jane'), { uid: 'jane', hash: 'x', salt: 'y', attempts: 0 });
});
const anon = env.unauthenticatedContext().firestore();
const jane = env.authenticatedContext('jane').firestore();
const admin = env.authenticatedContext('admin').firestore();
const newUser = env.authenticatedContext('newbie').firestore();
let pass = 0, fail = 0;
async function t(name, p) {
  try { await p; pass++; console.log('  ✓', name); }
  catch (e) { fail++; console.log('  ✗', name, '—', e.message.slice(0, 120)); }
}

// events
await t('anon lists published', assertSucceeds(getDocs(query(collection(anon, 'events'), where('status', '==', 'published')))));
await t('anon cannot read draft', assertFails(getDoc(doc(anon, 'events/draft'))));
await t('jane cannot write event', assertFails(setDoc(doc(jane, 'events/x'), { status: 'published' })));
await t('admin writes event', assertSucceeds(setDoc(doc(admin, 'events/x'), { status: 'draft' })));
// users
await t('register as resident', assertSucceeds(setDoc(doc(newUser, 'users/newbie'), { role: 'resident', name: 'N' })));
await t('register as admin blocked', assertFails(setDoc(doc(env.authenticatedContext('sneaky').firestore(), 'users/sneaky'), { role: 'admin' })));
await t('edit own profile', assertSucceeds(updateDoc(doc(jane, 'users/jane'), { name: 'Jane D', interests: ['music'] })));
await t('cannot make self admin', assertFails(updateDoc(doc(jane, 'users/jane'), { role: 'admin' })));
await t('save refund bank', assertSucceeds(updateDoc(doc(jane, 'users/jane'), { refundBank: { holder: 'Jane' } })));
await t('cannot read other user', assertFails(getDoc(doc(jane, 'users/admin'))));
// tickets
await t('create own hold', assertSucceeds(setDoc(doc(jane, 'tickets/TKT-J'), { userId: 'jane', status: 'pending_payment', eventId: 'e1', totalPrice: 362.25 })));
await t('create confirmed blocked', assertFails(setDoc(doc(jane, 'tickets/TKT-X'), { userId: 'jane', status: 'confirmed' })));
await t('create for someone else blocked', assertFails(setDoc(doc(jane, 'tickets/TKT-Y'), { userId: 'bob', status: 'pending_payment' })));
await t('list own tickets', assertSucceeds(getDocs(query(collection(jane, 'tickets'), where('userId', '==', 'jane')))));
await t('cannot read others ticket', assertFails(getDoc(doc(jane, 'tickets/TKT-OTHER'))));
await t('cannot self-approve', assertFails(updateDoc(doc(jane, 'tickets/TKT-J'), { status: 'confirmed' })));
await t('cannot change price', assertFails(updateDoc(doc(jane, 'tickets/TKT-J'), { totalPrice: 1 })));
await t('upload proof', assertSucceeds(updateDoc(doc(jane, 'tickets/TKT-J'), { proofOfPayment: 'data:x', proofUploadedAt: 'now', status: 'pending_verification' })));
await t('admin sees pending queue', assertSucceeds(getDocs(query(collection(admin, 'tickets'), where('status', '==', 'pending_verification')))));
await t('admin rejects', assertSucceeds(updateDoc(doc(admin, 'tickets/TKT-J'), { status: 'rejected', rejection: { reason: 'Reference missing', keepHeld: true } })));
await t('re-upload after reject', assertSucceeds(updateDoc(doc(jane, 'tickets/TKT-J'), { proofOfPayment: 'data:y', proofUploadedAt: 'now2', status: 'pending_verification' })));
await t('admin approves', assertSucceeds(updateDoc(doc(admin, 'tickets/TKT-J'), { status: 'confirmed', validated: true, rejection: deleteField() })));
await t('send to friend', assertSucceeds(updateDoc(doc(jane, 'tickets/TKT-J'), { transfer: { toName: 'Thabo', status: 'pending' } })));
await t('cancel transfer', assertSucceeds(updateDoc(doc(jane, 'tickets/TKT-J'), { 'transfer.status': 'cancelled' })));
await t('release to waitlist', assertSucceeds(updateDoc(doc(jane, 'tickets/TKT-J'), { releasedToWaitlist: true, releasedAt: 'now' })));
await t('request refund', assertSucceeds(updateDoc(doc(jane, 'tickets/TKT-J'), { refundRequested: true, refundRequestedAt: 'now' })));
await t('cannot self check-in', assertFails(updateDoc(doc(jane, 'tickets/TKT-J'), { checkedIn: true })));
await t('admin checks in', assertSucceeds(updateDoc(doc(admin, 'tickets/TKT-J'), { checkedIn: true, checkedInAt: 'now', checkedInDoor: 'Door A' })));
await t('admin event guest list', assertSucceeds(getDocs(query(collection(admin, 'tickets'), where('eventId', '==', 'e1')))));
await t('guest cannot list event tickets', assertFails(getDocs(query(collection(jane, 'tickets'), where('eventId', '==', 'e1')))));
// website-style bookings (no status field)
await t('create website booking', assertSucceeds(setDoc(doc(jane, 'tickets/TKT-W'), { userId: 'jane', eventId: 'e1', total: 1500, validated: false })));
await t('upload proof on website booking', assertSucceeds(updateDoc(doc(jane, 'tickets/TKT-W'), { proofOfPayment: 'x', proofUploadedAt: 'now', status: 'pending_verification' })));
await t('cannot self-confirm website booking', assertFails(setDoc(doc(jane, 'tickets/TKT-W2'), { userId: 'jane', status: 'confirmed' })));
await t('anon reads gallery', assertSucceeds(getDocs(collection(anon, 'gallery'))));
await t('anon reads content', assertSucceeds(getDoc(doc(anon, 'content/footer'))));
await t('jane cannot write content', assertFails(setDoc(doc(jane, 'content/footer'), { x: 1 })));
await t('admin writes gallery', assertSucceeds(setDoc(doc(admin, 'gallery/g1'), { x: 1 })));
// waitlist
await t('join waitlist', assertSucceeds(setDoc(doc(jane, 'waitlist/e1_jane'), { eventId: 'e1', userId: 'jane', userName: 'Jane', quantity: 1, whatsappAlerts: true, joinedAt: 'now' })));
await t('join as someone else blocked', assertFails(setDoc(doc(jane, 'waitlist/e1_bob'), { eventId: 'e1', userId: 'bob', quantity: 1 })));
await t('read waitlist for position', assertSucceeds(getDocs(query(collection(jane, 'waitlist'), where('eventId', '==', 'e1')))));
await t('toggle alerts', assertSucceeds(setDoc(doc(jane, 'waitlist/e1_jane'), { whatsappAlerts: false }, { merge: true })));
await t('cannot give self offer', assertFails(updateDoc(doc(jane, 'waitlist/e1_jane'), { offerExpiresAt: 'x' })));
await t('admin sets offer', assertSucceeds(updateDoc(doc(admin, 'waitlist/e1_jane'), { offerExpiresAt: 'x' })));
await t('leave waitlist', assertSucceeds(deleteDoc(doc(jane, 'waitlist/e1_jane'))));
// enquiries, ratings, promo, config
await t('send enquiry', assertSucceeds(addDoc(collection(jane, 'enquiries'), { name: 'Jane', vibe: 'x' })));
await t('cannot read enquiries', assertFails(getDocs(collection(jane, 'enquiries'))));
await t('send rating', assertSucceeds(addDoc(collection(jane, 'ratings'), { eventId: 'e1', userId: null, stars: 4, highlights: [], fix: '', anonymous: true })));
await t('bad rating blocked', assertFails(addDoc(collection(jane, 'ratings'), { stars: 9 })));
await t('look up promo', assertSucceeds(getDoc(doc(jane, 'promoCodes/BRAAMFAM'))));
await t('cannot list promos', assertFails(getDocs(collection(jane, 'promoCodes'))));
// access codes: a booking with a code must count one use in the same batch
const comp = (code, extra = {}) => ({ userId: 'jane', eventId: 'e1', status: 'confirmed', totalPrice: 0, promoCode: code, ...extra });
// Books with a code the way the app does: the ticket and one use, together.
function bookWith(db, id, data, uses = 1) {
  const b = writeBatch(db);
  b.set(doc(db, `tickets/${id}`), data);
  if (data.promoCode) b.update(doc(db, `promoCodes/${data.promoCode}`), { uses: increment(uses), lastTicketId: id });
  return b.commit();
}
await t('free booking with a comp code (counts one use)', assertSucceeds(bookWith(jane, 'TKT-COMP1', comp('COMP-GOOD'))));
await t('no free booking without counting the use', assertFails(setDoc(doc(jane, 'tickets/TKT-COMP1B'), comp('COMP-GOOD'))));
await t('no free booking that counts two uses', assertFails(bookWith(jane, 'TKT-COMP1C', comp('COMP-GOOD'), 2)));
await t('no free booking without a code', assertFails(setDoc(doc(jane, 'tickets/TKT-COMP2'), comp(''))));
await t('no free booking with a discount code', assertFails(bookWith(jane, 'TKT-COMP3', comp('BRAAMFAM'))));
await t('no free booking with an unknown code', assertFails(bookWith(jane, 'TKT-COMP4', comp('COMP-FAKE'))));
await t('no free booking with a switched-off code', assertFails(bookWith(jane, 'TKT-COMP5', comp('COMP-OFF'))));
await t('no free booking with a used-up code', assertFails(bookWith(jane, 'TKT-COMP6', comp('COMP-FULL'))));
await t('no free booking with an expired code', assertFails(bookWith(jane, 'TKT-COMP7', comp('COMP-OLD'))));
await t('no free booking for another event', assertFails(bookWith(jane, 'TKT-COMP8', comp('COMP-E2'))));
await t('comp code cannot confirm a paid booking', assertFails(bookWith(jane, 'TKT-COMP9', comp('COMP-GOOD', { totalPrice: 300 }))));
await t('paid booking with a discount code counts a use', assertSucceeds(bookWith(jane, 'TKT-DISC1', { userId: 'jane', eventId: 'e1', status: 'pending_payment', totalPrice: 300, promoCode: 'BRAAMFAM' })));
await t('paid booking cannot use a used-up code', assertFails(bookWith(jane, 'TKT-DISC2', { userId: 'jane', eventId: 'e1', status: 'pending_payment', totalPrice: 0, promoCode: 'COMP-FULL' })));
await t('paid booking without a code needs no count', assertSucceeds(setDoc(doc(jane, 'tickets/TKT-PLAIN'), { userId: 'jane', eventId: 'e1', status: 'pending_payment', totalPrice: 300 })));
await t('cannot count a use without a booking', assertFails(updateDoc(doc(jane, 'promoCodes/COMP-GOOD'), { uses: 2, lastTicketId: 'TKT-NONE' })));
await t('cannot count a use for an existing booking', assertFails(updateDoc(doc(jane, 'promoCodes/COMP-GOOD'), { uses: 2, lastTicketId: 'TKT-COMP1' })));
await t("cannot use someone else's booking to count", assertFails(updateDoc(doc(newUser, 'promoCodes/COMP-GOOD'), { uses: 2, lastTicketId: 'TKT-COMP1' })));
// The reported case: a 1-use free code used by the admin, then tried by a resident.
await t('1-use free code: first booking works', assertSucceeds(bookWith(admin, 'TKT-ONE1', { ...comp('COMP-ONE'), userId: 'admin' })));
await t('1-use free code: nobody can use it again', assertFails(bookWith(jane, 'TKT-ONE2', comp('COMP-ONE'))));
await t('cannot skip use counts', assertFails(updateDoc(doc(jane, 'promoCodes/COMP-GOOD'), { uses: 5 })));
await t('cannot switch a code back on', assertFails(updateDoc(doc(jane, 'promoCodes/COMP-OFF'), { active: true })));
await t('admin creates a code', assertSucceeds(setDoc(doc(admin, 'promoCodes/SAVE20-ABCDEF'), { type: 'percent', percentOff: 20, active: true, uses: 0 })));
await t('admin lists codes', assertSucceeds(getDocs(collection(admin, 'promoCodes'))));
await t('anon reads config', assertSucceeds(getDoc(doc(anon, 'config/app'))));
await t('cannot write config', assertFails(setDoc(doc(jane, 'config/app'), { minVersion: '9' })));
// one-time codes: server only
await t('cannot read own code record', assertFails(getDoc(doc(jane, 'otpCodes/verify-email:jane'))));
await t('cannot reset own attempt count', assertFails(updateDoc(doc(jane, 'otpCodes/verify-email:jane'), { attempts: 0 })));
await t('cannot write a code record', assertFails(setDoc(doc(jane, 'otpCodes/admin-login:jane'), { hash: 'mine' })));
await t('admin cannot read code records', assertFails(getDocs(collection(admin, 'otpCodes'))));
// delete account
await t('delete own profile', assertSucceeds(deleteDoc(doc(jane, 'users/jane'))));
console.log(`\n${pass} passed, ${fail} failed`);
await env.cleanup();
process.exit(fail ? 1 : 0);
