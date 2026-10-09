// Firestore security rules tests. Runs against the local Firestore
// emulator (never the live database): npm run test:rules
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection, query, where, getDocs, deleteField } from 'firebase/firestore';

const env = await initializeTestEnvironment({ projectId: 'demo-friends', firestore: { rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8'), host: '127.0.0.1', port: 8085 } });
await env.withSecurityRulesDisabled(async (c) => {
  const db = c.firestore();
  await setDoc(doc(db, 'users/admin'), { role: 'admin', name: 'Lebo' });
  await setDoc(doc(db, 'users/jane'), { role: 'resident', name: 'Jane' });
  await setDoc(doc(db, 'events/e1'), { status: 'published', title: 'Braam After Dark' });
  await setDoc(doc(db, 'events/draft'), { status: 'draft' });
  await setDoc(doc(db, 'tickets/TKT-OTHER'), { userId: 'bob', status: 'pending_payment', eventId: 'e1' });
  await setDoc(doc(db, 'promoCodes/BRAAMFAM'), { percentOff: 10, active: true });
  await setDoc(doc(db, 'config/app'), { minVersion: '1.0.0' });
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
await t('anon reads config', assertSucceeds(getDoc(doc(anon, 'config/app'))));
await t('cannot write config', assertFails(setDoc(doc(jane, 'config/app'), { minVersion: '9' })));
// delete account
await t('delete own profile', assertSucceeds(deleteDoc(doc(jane, 'users/jane'))));
console.log(`\n${pass} passed, ${fail} failed`);
await env.cleanup();
process.exit(fail ? 1 : 0);
