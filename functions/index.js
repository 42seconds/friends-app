// &FRIENDS Cloud Functions: one-time codes sent by email.
//
//   sendCode   – emails a 6-digit code for one of:
//                  verify-email    confirm the logged-in person's email
//                  admin-login     the second step when an admin logs in
//                  reset-password  forgot password (no login needed)
//   verifyCode – checks a typed code and, if right, does the thing:
//                  marks the email confirmed / unlocks staff mode for
//                  12 hours / sets the new password.
//
// Codes are created and checked here on the server, so the app can't fake
// or skip them. Only a salted hash of each code is stored, in otpCodes/,
// which the app itself can't read or write (see firestore.rules).
//
// Email goes out through an SMTP account (e.g. a Gmail address with an app
// password). Set it once with:
//   npx firebase-tools functions:secrets:set SMTP_USER
//   npx firebase-tools functions:secrets:set SMTP_PASS
// See docs/otp-codes.md.
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { setGlobalOptions } = require('firebase-functions/v2');
const logger = require('firebase-functions/logger');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const nodemailer = require('nodemailer');
const otp = require('./otp');

initializeApp();
setGlobalOptions({ region: 'us-central1', maxInstances: 5 });

const SMTP_USER = defineSecret('SMTP_USER');
const SMTP_PASS = defineSecret('SMTP_PASS');
// Gmail by default; SMTP_HOST / SMTP_PORT (functions/.env) switch to
// another provider, or to a local test mail server.
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);

const db = () => getFirestore();
const recordRef = (purpose, uid) => db().collection('otpCodes').doc(`${purpose}:${uid}`);

function sendMail(to, purpose, code) {
  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER.value(), pass: SMTP_PASS.value() },
  });
  const { subject, text, html } = otp.emailContent(purpose, code);
  return transport.sendMail({ from: `"&FRIENDS" <${SMTP_USER.value()}>`, to, subject, text, html });
}

async function isAdmin(uid) {
  const snap = await db().collection('users').doc(uid).get();
  return snap.exists && snap.data().role === 'admin';
}

// Who the code is for: the logged-in person, or (reset-password) the
// account with the given email. null = no such account.
async function target(purpose, request) {
  if (purpose === 'reset-password') {
    const email = otp.normalizeEmail(request.data?.email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpsError('invalid-argument', "That email doesn't look right.");
    try {
      const u = await getAuth().getUserByEmail(email);
      return { uid: u.uid, email: u.email };
    } catch (e) {
      if (e?.code === 'auth/user-not-found') return null;
      throw e;
    }
  }
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Please log in first.');
  const u = await getAuth().getUser(uid);
  if (!u.email) throw new HttpsError('failed-precondition', 'This account has no email address.');
  if (purpose === 'admin-login' && !(await isAdmin(uid))) throw new HttpsError('permission-denied', 'Only staff accounts need this code.');
  return { uid, email: u.email };
}

function readPurpose(request) {
  const purpose = request.data?.purpose;
  if (!otp.PURPOSES.includes(purpose)) throw new HttpsError('invalid-argument', 'Unknown code type.');
  return purpose;
}

exports.sendCode = onCall({ secrets: [SMTP_USER, SMTP_PASS] }, async (request) => {
  const purpose = readPurpose(request);
  const who = await target(purpose, request);
  // Forgot password for an email with no account: answer the same as
  // success, so nobody can use this to check who is signed up.
  if (!who) return { sent: true, resendIn: otp.RESEND_MS / 1000 };

  const ref = recordRef(purpose, who.uid);
  const now = Date.now();
  const code = otp.newCode();
  const blocked = await db().runTransaction(async (tx) => {
    const prev = (await tx.get(ref)).data();
    const why = otp.sendBlocked(prev, now);
    if (why) return why;
    tx.set(ref, { ...otp.newRecord(code, now, prev), uid: who.uid, purpose });
    return null;
  });
  if (blocked) {
    throw new HttpsError('resource-exhausted', blocked.reason === 'wait' ? `Wait ${blocked.retryInSeconds}s before asking for another code.` : 'Too many codes sent. Try again later.', { retryIn: blocked.retryInSeconds });
  }

  try {
    await sendMail(who.email, purpose, code);
  } catch (e) {
    logger.error('Could not send code email', { purpose, uid: who.uid, error: e?.message });
    await ref.delete().catch(() => {});
    throw new HttpsError('unavailable', "We couldn't send the email. Please try again in a minute.");
  }
  return { sent: true, resendIn: otp.RESEND_MS / 1000 };
});

exports.verifyCode = onCall(async (request) => {
  const purpose = readPurpose(request);
  const who = await target(purpose, request);
  if (!who) throw new HttpsError('not-found', 'That code is wrong or has expired. Ask for a new one.');

  if (purpose === 'reset-password') {
    const problem = otp.passwordProblem(request.data?.newPassword);
    if (problem) throw new HttpsError('invalid-argument', problem);
  }

  const ref = recordRef(purpose, who.uid);
  const now = Date.now();
  const result = await db().runTransaction(async (tx) => {
    const rec = (await tx.get(ref)).data();
    const r = otp.checkCode(rec, request.data?.code, now);
    if (r.ok || r.reason === 'expired' || r.reason === 'locked') tx.delete(ref);
    else if (r.reason === 'wrong') tx.update(ref, { attempts: (rec.attempts ?? 0) + 1 });
    return r;
  });

  if (!result.ok) {
    const messages = {
      missing: 'That code has expired or was already used. Ask for a new one.',
      expired: 'That code has expired. Ask for a new one.',
      locked: 'Too many wrong tries. Ask for a new code.',
      format: 'Enter the 6-digit code from the email.',
      wrong: result.attemptsLeft > 0 ? `That code isn't right. ${result.attemptsLeft} ${result.attemptsLeft === 1 ? 'try' : 'tries'} left.` : 'Too many wrong tries. Ask for a new code.',
    };
    throw new HttpsError(result.reason === 'format' || result.reason === 'wrong' ? 'invalid-argument' : 'failed-precondition', messages[result.reason], { reason: result.reason, attemptsLeft: result.attemptsLeft });
  }

  if (purpose === 'verify-email') {
    await getAuth().updateUser(who.uid, { emailVerified: true });
    return { verified: true };
  }
  if (purpose === 'admin-login') {
    const until = now + otp.ADMIN_TRUST_MS;
    const user = await getAuth().getUser(who.uid);
    await getAuth().setCustomUserClaims(who.uid, { ...(user.customClaims ?? {}), mfaUntil: until });
    return { verified: true, until };
  }
  // reset-password: new password, and log out every other device.
  await getAuth().updateUser(who.uid, { password: request.data.newPassword });
  await getAuth().revokeRefreshTokens(who.uid);
  return { verified: true };
});
