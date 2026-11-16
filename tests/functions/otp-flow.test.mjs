// End-to-end test of the email codes (functions/index.js), run against the
// local Firebase emulators, never the live project: npm run test:otp
//
// A tiny mail server here catches the emails the functions send, so the
// test can read each code the way a person would.
import net from 'node:net';
import { createRequire } from 'node:module';
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';

const require = createRequire(new URL('../../functions/package.json', import.meta.url));
const { initializeApp: initAdmin } = require('firebase-admin/app');
const { getFirestore: adminDb } = require('firebase-admin/firestore');

// ---- fake mail server --------------------------------------------------
const inbox = [];
const smtp = net.createServer((sock) => {
  let data = false;
  let buf = '';
  let msg = '';
  sock.write('220 test\r\n');
  sock.on('data', (chunk) => {
    buf += chunk.toString();
    let i;
    while ((i = buf.indexOf('\r\n')) >= 0) {
      const line = buf.slice(0, i);
      buf = buf.slice(i + 2);
      if (data) {
        if (line === '.') {
          data = false;
          inbox.push(msg);
          msg = '';
          sock.write('250 queued\r\n');
        } else msg += line + '\n';
        continue;
      }
      const cmd = line.slice(0, 4).toUpperCase();
      if (cmd === 'EHLO' || cmd === 'HELO') sock.write('250-test\r\n250 AUTH PLAIN LOGIN\r\n');
      else if (cmd === 'AUTH') sock.write('235 ok\r\n');
      else if (cmd === 'DATA') {
        data = true;
        sock.write('354 go\r\n');
      } else if (cmd === 'QUIT') {
        sock.write('221 bye\r\n');
        sock.end();
      } else sock.write('250 ok\r\n');
    }
  });
});
await new Promise((r) => smtp.listen(2525, '127.0.0.1', r));

function lastCodeFor(email) {
  const m = [...inbox].reverse().find((x) => x.toLowerCase().includes(`to: ${email}`));
  const hit = m && /code: (\d{3}) (\d{3})/.exec(m.replace(/=\r?\n/g, ''));
  return hit ? hit[1] + hit[2] : null;
}

// ---- Firebase (emulators) ---------------------------------------------
const projectId = 'demo-friends';
const app = initializeApp({ apiKey: 'demo', projectId, authDomain: `${projectId}.firebaseapp.com` });
const auth = getAuth(app);
connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
const fns = getFunctions(app, 'us-central1');
connectFunctionsEmulator(fns, '127.0.0.1', 5001);
const sendCode = httpsCallable(fns, 'sendCode');
const verifyCode = httpsCallable(fns, 'verifyCode');
initAdmin({ projectId });
const db = adminDb();

let pass = 0, fail = 0;
async function t(name, fn) {
  try { await fn(); pass++; console.log('  ✓', name); }
  catch (e) { fail++; console.log('  ✗', name, '—', (e.code ? e.code + ' ' : '') + String(e.message).slice(0, 160)); }
}
const expectError = async (p, code, text) => {
  try { await p; } catch (e) {
    if (code && e.code !== `functions/${code}`) throw new Error(`expected ${code}, got ${e.code}: ${e.message}`);
    if (text && !e.message.includes(text)) throw new Error(`expected "${text}" in "${e.message}"`);
    return e;
  }
  throw new Error('expected an error');
};
const assert = (ok, what) => { if (!ok) throw new Error(what); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const clearRecord = (purpose, uid) => db.doc(`otpCodes/${purpose}:${uid}`).delete();

// ---- confirm email -----------------------------------------------------
const jane = 'jane@example.com';
const { user } = await createUserWithEmailAndPassword(auth, jane, 'goodpass1');

await t('sign-up: emails a code to confirm the email', async () => {
  await sendCode({ purpose: 'verify-email' });
  await wait(300);
  assert(/^\d{6}$/.test(lastCodeFor(jane) ?? ''), 'no code in the email');
});
await t('asking again straight away is refused with a wait time', async () => {
  const e = await expectError(sendCode({ purpose: 'verify-email' }), 'resource-exhausted');
  assert(e.details?.retryIn > 0, 'no retryIn');
});
await t('a wrong code says how many tries are left', async () => {
  const right = lastCodeFor(jane);
  const wrong = right === '000000' ? '111111' : '000000';
  await expectError(verifyCode({ purpose: 'verify-email', code: wrong }), 'invalid-argument', '4 tries left');
});
await t('the right code confirms the email', async () => {
  const r = await verifyCode({ purpose: 'verify-email', code: lastCodeFor(jane) });
  assert(r.data.verified, 'not verified');
  await user.reload();
  assert(auth.currentUser.emailVerified, 'email not marked verified');
});
await t('a used code no longer works', async () => {
  await expectError(verifyCode({ purpose: 'verify-email', code: lastCodeFor(jane) }), 'failed-precondition', 'expired or was already used');
});

// ---- too many wrong tries ----------------------------------------------
await t('five wrong tries lock the code', async () => {
  await clearRecord('verify-email', user.uid);
  await sendCode({ purpose: 'verify-email' });
  await wait(300);
  const right = lastCodeFor(jane);
  const wrong = right === '000000' ? '111111' : '000000';
  for (let i = 0; i < 4; i++) await expectError(verifyCode({ purpose: 'verify-email', code: wrong }), 'invalid-argument');
  await expectError(verifyCode({ purpose: 'verify-email', code: wrong }), 'invalid-argument', 'Too many wrong tries');
  await expectError(verifyCode({ purpose: 'verify-email', code: right }), 'failed-precondition', 'Too many wrong tries');
});

// ---- admin 2-step -------------------------------------------------------
await t('members cannot ask for a staff code', async () => {
  await expectError(sendCode({ purpose: 'admin-login' }), 'permission-denied');
});
const lebo = 'lebo@example.com';
await signOut(auth);
const { user: adminUser } = await createUserWithEmailAndPassword(auth, lebo, 'staffpass1');
await db.doc(`users/${adminUser.uid}`).set({ role: 'admin', name: 'Lebo' });
await t('admin login: emails a staff code', async () => {
  await sendCode({ purpose: 'admin-login' });
  await wait(300);
  assert(/^\d{6}$/.test(lastCodeFor(lebo) ?? ''), 'no code');
  assert(inbox.at(-1).includes('staff login code'), 'wrong subject');
});
await t('the staff code unlocks staff mode for 12 hours', async () => {
  const r = await verifyCode({ purpose: 'admin-login', code: lastCodeFor(lebo) });
  const hours = (r.data.until - Date.now()) / 3600000;
  assert(hours > 11.9 && hours <= 12, `until is ${hours}h away`);
  const token = await adminUser.getIdTokenResult(true);
  assert(token.claims.mfaUntil === r.data.until, 'claim not on the login token');
});

// ---- forgot password -----------------------------------------------------
await signOut(auth);
await t('forgot password for an unknown email answers like success (no leak)', async () => {
  const before = inbox.length;
  const r = await sendCode({ purpose: 'reset-password', email: 'nobody@example.com' });
  assert(r.data.sent, 'not "sent"');
  await wait(300);
  assert(inbox.length === before, 'an email was sent');
});
await t('forgot password: a weak new password is refused before the code is used', async () => {
  await sendCode({ purpose: 'reset-password', email: jane });
  await wait(300);
  await expectError(verifyCode({ purpose: 'reset-password', email: jane, code: lastCodeFor(jane), newPassword: 'short' }), 'invalid-argument', '8 characters');
});
await t('forgot password: the code sets the new password', async () => {
  await verifyCode({ purpose: 'reset-password', email: 'JANE@example.com ', code: lastCodeFor(jane), newPassword: 'newpass22' });
  await signInWithEmailAndPassword(auth, jane, 'newpass22');
  await signOut(auth);
  const old = await signInWithEmailAndPassword(auth, jane, 'goodpass1').then(() => 'worked', (e) => e.code);
  assert(String(old).startsWith('auth/'), `old password: ${old}`);
});
await t('code records are not readable as plain codes', async () => {
  await clearRecord('verify-email', user.uid).catch(() => {});
  const snap = await db.collection('otpCodes').get();
  for (const d of snap.docs) assert(!('code' in d.data()), 'plain code stored');
});

console.log(`\n${pass} passed, ${fail} failed`);
smtp.close();
process.exit(fail ? 1 : 0);
