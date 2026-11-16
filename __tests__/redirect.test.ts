import { redirectTarget, RedirectState } from '../src/lib/redirect';

const base: RedirectState = { segments: [], loggedIn: false, browsing: false, hasSeenOnboarding: false, hasSeenGuide: false };
const go = (s: Partial<RedirectState>) => redirectTarget({ ...base, ...s });

describe('where the app sends people', () => {
  it('reopening while logged in leaves the splash for Explore (the "stuck on &" bug)', () => {
    expect(go({ loggedIn: true, hasSeenOnboarding: true, hasSeenGuide: true })).toBe('/(tabs)/home');
  });
  it('first open after logging in shows the guide', () => {
    expect(go({ loggedIn: true, hasSeenGuide: false })).toBe('/guide');
  });
  it('logged out: first time sees onboarding, later the login screen', () => {
    expect(go({})).toBe('/(onboarding)/welcome');
    expect(go({ hasSeenOnboarding: true })).toBe('/(auth)/login');
  });
  it('a remembered guest goes straight to Explore', () => {
    expect(go({ browsing: true })).toBe('/(tabs)/home');
  });
  it('stays put on normal screens', () => {
    expect(go({ segments: ['(tabs)', 'home'], loggedIn: true, hasSeenGuide: true })).toBeNull();
    expect(go({ segments: ['guide'], loggedIn: true })).toBeNull();
    expect(go({ segments: ['verify-email'], loggedIn: true })).toBeNull();
    expect(go({ segments: ['(auth)', 'login'], hasSeenOnboarding: true })).toBeNull();
    expect(go({ segments: ['settings', 'help'] })).toBeNull();
    expect(go({ segments: ['event', '[id]'], browsing: true })).toBeNull();
  });
  it('sends people who just logged in on from the login screen', () => {
    expect(go({ segments: ['(auth)', 'login'], loggedIn: true, hasSeenGuide: true })).toBe('/(tabs)/home');
  });
  it('keeps logged-out visitors out of private screens', () => {
    expect(go({ segments: ['(tabs)', 'tickets'], hasSeenOnboarding: true })).toBe('/(auth)/login');
  });

  describe('admin 2-step verification', () => {
    const admin = { loggedIn: true, hasSeenOnboarding: true, hasSeenGuide: true };
    it('an admin who has not entered the code is sent to the code screen from anywhere', () => {
      expect(go({ ...admin, adminCodeNeeded: true })).toBe('/admin-verify');
      expect(go({ ...admin, segments: ['(tabs)', 'home'], adminCodeNeeded: true })).toBe('/admin-verify');
      expect(go({ ...admin, segments: ['staff', 'approvals'], adminCodeNeeded: true })).toBe('/admin-verify');
      expect(go({ ...admin, segments: ['(auth)', 'login'], adminCodeNeeded: true })).toBe('/admin-verify');
    });
    it('stays on the code screen until the code is entered', () => {
      expect(go({ ...admin, segments: ['admin-verify'], adminCodeNeeded: true })).toBeNull();
      expect(go({ ...admin, segments: ['admin-verify'], adminCodeNeeded: null })).toBeNull();
    });
    it('moves on once the code is entered', () => {
      expect(go({ ...admin, segments: ['admin-verify'], adminCodeNeeded: false })).toBe('/(tabs)/home');
      expect(go({ ...admin, segments: ['admin-verify'], hasSeenGuide: false, adminCodeNeeded: false })).toBe('/guide');
    });
    it('does not redirect while the role is still loading', () => {
      expect(go({ ...admin, segments: ['(tabs)', 'home'], adminCodeNeeded: null })).toBeNull();
    });
    it('members never see it', () => {
      expect(go({ ...admin, segments: ['(tabs)', 'home'], adminCodeNeeded: false })).toBeNull();
    });
  });
  it('logged-in people can use the forgot-password screen to change their password', () => {
    expect(go({ segments: ['(auth)', 'forgot'], loggedIn: true, hasSeenGuide: true })).toBeNull();
  });
});
