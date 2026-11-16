import { checkCode, checkMessage, CODE_TTL_MS, hashCode, MAX_ATTEMPTS, MAX_SENDS_PER_HOUR, newCode, newRecord, RESEND_MS, sendBlocked } from '../src/lib/codeRules';

const NOW = 1_800_000_000_000;

describe('demo email codes', () => {
  it('makes 6-digit codes', () => {
    for (let i = 0; i < 200; i++) expect(newCode()).toMatch(/^\d{6}$/);
  });
  it('never stores the code itself', () => {
    const rec = newRecord('123456', NOW);
    expect(JSON.stringify(rec)).not.toContain('123456');
    expect(rec.hash).toBe(hashCode('123456', rec.salt));
  });
  it('accepts the right code, with or without a space', () => {
    const rec = newRecord('123456', NOW);
    expect(checkCode(rec, '123456', NOW)).toEqual({ ok: true });
    expect(checkCode(rec, '123 456', NOW)).toEqual({ ok: true });
  });
  it('counts down wrong tries and then locks', () => {
    const rec = newRecord('123456', NOW);
    const r = checkCode(rec, '000000', NOW);
    expect(r).toEqual({ ok: false, reason: 'wrong', attemptsLeft: MAX_ATTEMPTS - 1 });
    if (!r.ok) expect(checkMessage(r)).toBe("That code isn't right. 4 tries left.");
    expect(checkCode({ ...rec, attempts: MAX_ATTEMPTS }, '123456', NOW)).toMatchObject({ ok: false, reason: 'locked' });
  });
  it('expires after 10 minutes', () => {
    const rec = newRecord('123456', NOW);
    expect(checkCode(rec, '123456', NOW + CODE_TTL_MS + 1)).toMatchObject({ ok: false, reason: 'expired' });
  });
  it('rejects missing and badly typed codes', () => {
    expect(checkCode(null, '123456', NOW)).toMatchObject({ reason: 'missing' });
    expect(checkCode(newRecord('123456', NOW), '1234', NOW)).toMatchObject({ reason: 'format' });
  });
  it('sends at most one email a minute and five an hour', () => {
    const first = newRecord('111111', NOW);
    expect(sendBlocked(first, NOW + 10_000)).toEqual({ reason: 'wait', retryInSeconds: 50 });
    expect(sendBlocked(first, NOW + RESEND_MS)).toBeNull();
    let rec: ReturnType<typeof newRecord> | undefined;
    let t = NOW;
    for (let i = 0; i < MAX_SENDS_PER_HOUR; i++) {
      rec = newRecord('111111', t, rec);
      t += RESEND_MS;
    }
    expect(sendBlocked(rec, t)?.reason).toBe('hourly');
  });
});
