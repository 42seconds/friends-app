import { checkName, checkEmail, checkPassword, checkPhone, normalizePhone, checkAccountNumber, checkBranchCode, checkGuests, checkText, collectErrors } from '../src/lib/validation';

describe('names', () => {
  it('accepts real names, including accents, hyphens and apostrophes', () => {
    for (const n of ['Ayanda', 'Mary-Jane', "O'Neil", 'Zoë', 'Van der Merwe']) expect(checkName(n)).toBeNull();
  });

  it('rejects empty, too short, too long or non-letter names', () => {
    expect(checkName('  ')).toBe('Add your name');
    expect(checkName('A')).toMatch(/too short/);
    expect(checkName('x'.repeat(51))).toMatch(/under 50/);
    expect(checkName('Robert123')).toMatch(/letters only/);
    expect(checkName('<script>')).toMatch(/letters only/);
  });

  it('allows an empty optional name', () => {
    expect(checkName('', 'last name', false)).toBeNull();
  });
});

describe('email', () => {
  it('accepts normal addresses', () => {
    expect(checkEmail('ayanda@gmail.com')).toBeNull();
    expect(checkEmail(' st10448302@rcconnect.edu.za ')).toBeNull();
  });

  it('rejects malformed addresses', () => {
    for (const e of ['', 'ayanda', 'ayanda@', 'ayanda@gmail', 'a b@gmail.com', 'a@b.c']) expect(checkEmail(e)).not.toBeNull();
  });
});

describe('password', () => {
  it('needs 8+ characters with a letter and a number', () => {
    expect(checkPassword('short1')).toMatch(/8 characters/);
    expect(checkPassword('allletters')).toMatch(/letter and one number/);
    expect(checkPassword('12345678')).toMatch(/letter and one number/);
    expect(checkPassword('braamfontein1')).toBeNull();
  });
});

describe('South African mobile numbers', () => {
  it('accepts the common ways of writing one', () => {
    for (const p of ['082 123 4567', '0821234567', '82 123 4567', '+27 82 123 4567', '27821234567', '(082) 123-4567']) {
      expect(checkPhone(p)).toBeNull();
      expect(normalizePhone(p)).toBe('+27821234567');
    }
  });

  it('rejects landlines, short numbers and letters', () => {
    for (const p of ['011 123 4567', '082 123', '082 123 45678', 'call me']) expect(checkPhone(p)).not.toBeNull();
  });

  it('is optional unless required', () => {
    expect(checkPhone('')).toBeNull();
    expect(checkPhone('', true)).toBe('Add a phone number');
    expect(normalizePhone('')).toBe('');
  });
});

describe('bank details', () => {
  it('checks account numbers', () => {
    expect(checkAccountNumber('1234 5678 90')).toBeNull();
    expect(checkAccountNumber('12345')).toMatch(/6 to 16/);
    expect(checkAccountNumber('12-34-56')).toMatch(/digits only/);
  });

  it('checks branch codes', () => {
    expect(checkBranchCode('470010')).toBeNull();
    expect(checkBranchCode('47001')).toMatch(/6 digits/);
  });
});

describe('host enquiry', () => {
  it('checks guest numbers', () => {
    expect(checkGuests('')).toBeNull();
    expect(checkGuests('120')).toBeNull();
    expect(checkGuests('0')).not.toBeNull();
    expect(checkGuests('about 100')).toMatch(/whole number/);
  });

  it('limits free text', () => {
    expect(checkText('', 'the vibe')).toBe('Add the vibe');
    expect(checkText('x'.repeat(1001), 'the vibe')).toMatch(/under 1000/);
  });
});

describe('collectErrors', () => {
  it('keeps only the failed checks', () => {
    expect(collectErrors({ first: null, email: "That email doesn't look right" })).toEqual({ email: "That email doesn't look right" });
  });
});
