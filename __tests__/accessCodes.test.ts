import { generateCode, toAccessCode, codeProblem, isWellFormed, describeCode } from '../src/lib/accessCodes';

describe('access codes', () => {
  it('generates readable codes with a prefix', () => {
    expect(generateCode('comp', 100, () => 0)).toBe('COMP-AAAAAA');
    expect(generateCode('percent', 20)).toMatch(/^SAVE20-[A-HJ-KM-NP-Z2-9]{6}$/);
    expect(isWellFormed(generateCode('percent', 15))).toBe(true);
    expect(isWellFormed('bad/code')).toBe(false);
  });

  it('reads old discount codes', () => {
    const c = toAccessCode('BRAAMFAM', { percentOff: 10, active: true });
    expect(c).toMatchObject({ type: 'percent', percentOff: 10, uses: 0, active: true });
    expect(describeCode(c)).toBe('10% off face value');
  });

  it('treats comp codes as 100% off', () => {
    const c = toAccessCode('COMP-X', { type: 'comp', percentOff: 0 });
    expect(c.percentOff).toBe(100);
    expect(describeCode(c)).toBe('Free tickets (comp)');
  });

  it('explains why a code cannot be used', () => {
    const base = toAccessCode('X', { type: 'percent', percentOff: 10 });
    expect(codeProblem(base, 'e1')).toBeNull();
    expect(codeProblem({ ...base, active: false }, 'e1')).toMatch(/switched off/);
    expect(codeProblem({ ...base, eventId: 'e2' }, 'e1')).toMatch(/isn't for this event/);
    expect(codeProblem({ ...base, expiresAt: '2020-01-01T00:00:00Z' }, 'e1')).toMatch(/expired/);
    expect(codeProblem({ ...base, maxUses: 5, uses: 5 }, 'e1')).toMatch(/fully used/);
    expect(codeProblem({ ...base, maxUses: 5, uses: 4 }, 'e1')).toBeNull();
  });
});
