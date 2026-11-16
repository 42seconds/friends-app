const test = require('node:test');
const assert = require('node:assert/strict');
const otp = require('../otp');

const NOW = 1_800_000_000_000;

test('codes are 6 digits', () => {
  for (let i = 0; i < 200; i++) assert.match(otp.newCode(), /^\d{6}$/);
});

test('only a hash of the code is stored', () => {
  const rec = otp.newRecord('123456', NOW);
  assert.ok(!JSON.stringify(rec).includes('123456'));
  assert.equal(rec.attempts, 0);
  assert.equal(rec.expiresAt, NOW + otp.CODE_TTL_MS);
});

test('the right code passes, a wrong one counts down', () => {
  const rec = otp.newRecord('123456', NOW);
  assert.deepEqual(otp.checkCode(rec, '123456', NOW + 1000), { ok: true });
  assert.deepEqual(otp.checkCode(rec, '123 456', NOW + 1000), { ok: true });
  const wrong = otp.checkCode(rec, '654321', NOW + 1000);
  assert.equal(wrong.ok, false);
  assert.equal(wrong.reason, 'wrong');
  assert.equal(wrong.attemptsLeft, otp.MAX_ATTEMPTS - 1);
});

test('expired, used up, missing and badly typed codes fail', () => {
  const rec = otp.newRecord('123456', NOW);
  assert.equal(otp.checkCode(rec, '123456', NOW + otp.CODE_TTL_MS + 1).reason, 'expired');
  assert.equal(otp.checkCode({ ...rec, attempts: otp.MAX_ATTEMPTS }, '123456', NOW).reason, 'locked');
  assert.equal(otp.checkCode(undefined, '123456', NOW).reason, 'missing');
  assert.equal(otp.checkCode(rec, '12345', NOW).reason, 'format');
});

test('one email a minute, five an hour', () => {
  const first = otp.newRecord('111111', NOW);
  assert.equal(otp.sendBlocked(undefined, NOW), null);
  const soon = otp.sendBlocked(first, NOW + 10_000);
  assert.equal(soon.reason, 'wait');
  assert.equal(soon.retryInSeconds, 50);
  assert.equal(otp.sendBlocked(first, NOW + otp.RESEND_MS), null);

  let rec;
  let t = NOW;
  for (let i = 0; i < otp.MAX_SENDS_PER_HOUR; i++) {
    rec = otp.newRecord('111111', t, rec);
    t += otp.RESEND_MS;
  }
  assert.equal(otp.sendBlocked(rec, t).reason, 'hourly');
  assert.equal(otp.sendBlocked(rec, NOW + 60 * 60 * 1000 + 1), null);
});

test('new password rules match sign-up', () => {
  assert.equal(otp.passwordProblem('Ab1!'), 'Use at least 8 characters.');
  assert.equal(otp.passwordProblem('braamfun9!'), 'Add an uppercase letter (A–Z).');
  assert.equal(otp.passwordProblem('BRAAMFUN9!'), 'Add a lowercase letter (a–z).');
  assert.equal(otp.passwordProblem('Braamfun!!'), 'Add a number (0–9).');
  assert.equal(otp.passwordProblem('Braamfun99'), 'Add a symbol, like ! @ # ? or *.');
  assert.equal(otp.passwordProblem('Braam fun9!'), 'Take out the spaces.');
  assert.equal(otp.passwordProblem('Braamfun9!'), null);
});

test('emails show the code and never leak HTML', () => {
  const { subject, text, html } = otp.emailContent('admin-login', '042917');
  assert.match(subject, /staff login code/);
  assert.match(text, /042 917/);
  assert.match(html, /042 917/);
  assert.ok(!html.includes('&FRIENDS app'), 'ampersands are escaped in HTML');
});
