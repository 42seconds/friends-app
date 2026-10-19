import { parseSavedUser, savedUserKey } from '../src/lib/savedUser';

describe('saved login', () => {
  it('uses the same key as Firebase', () => {
    expect(savedUserKey('KEY')).toBe('firebase:authUser:KEY:[DEFAULT]');
  });

  it('reads the fields the app uses', () => {
    const u = parseSavedUser(JSON.stringify({ uid: 'u1', email: 'a@b.co', displayName: 'Ana', emailVerified: true, createdAt: '1700000000000', stsTokenManager: {} }))!;
    expect(u.uid).toBe('u1');
    expect(u.email).toBe('a@b.co');
    expect(u.displayName).toBe('Ana');
    expect(u.metadata.creationTime).toBe(new Date(1700000000000).toUTCString());
  });

  it('returns null for nothing saved or broken data', () => {
    expect(parseSavedUser(null)).toBeNull();
    expect(parseSavedUser('not json')).toBeNull();
    expect(parseSavedUser('{"email":"x"}')).toBeNull();
  });
});
