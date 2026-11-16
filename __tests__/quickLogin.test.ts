// Quick sign-in (fingerprint / face / phone PIN). The phone's fingerprint
// reader and secure storage are simulated here.
const mockStore = new Map<string, string>();
let mockLevel = 3; // BIOMETRIC_STRONG
let mockTypes = [1]; // FINGERPRINT
let mockAuth: any = { success: true };

jest.mock('react-native', () => ({ Platform: { OS: 'android' } }));
jest.mock('@react-native-async-storage/async-storage', () => {
  const m = new Map<string, string>();
  return { __esModule: true, default: { getItem: async (k: string) => m.get(k) ?? null, setItem: async (k: string, v: string) => void m.set(k, v), clear: () => m.clear() } };
});
jest.mock('expo-secure-store', () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 6,
  getItemAsync: async (k: string) => mockStore.get(k) ?? null,
  setItemAsync: async (k: string, v: string) => void mockStore.set(k, v),
  deleteItemAsync: async (k: string) => void mockStore.delete(k),
}));
jest.mock('expo-local-authentication', () => ({
  SecurityLevel: { NONE: 0, SECRET: 1, BIOMETRIC_WEAK: 2, BIOMETRIC_STRONG: 3 },
  AuthenticationType: { FINGERPRINT: 1, FACIAL_RECOGNITION: 2, IRIS: 3 },
  getEnrolledLevelAsync: async () => mockLevel,
  supportedAuthenticationTypesAsync: async () => mockTypes,
  authenticateAsync: async () => mockAuth,
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { enableQuickLogin, forgetIfStale, quickLoginEmail, quickLoginKind, shouldOfferQuickLogin, unlockSavedLogin } from '../src/lib/quickLogin';

beforeEach(() => {
  mockStore.clear();
  (AsyncStorage as any).clear();
  mockLevel = 3;
  mockTypes = [1];
  mockAuth = { success: true };
});

describe('quick sign-in', () => {
  it('names what the phone has: fingerprint, face, or its PIN', async () => {
    expect(await quickLoginKind()).toMatchObject({ available: true, label: 'fingerprint' });
    mockTypes = [2];
    expect((await quickLoginKind()).label).toBe('face unlock');
    mockLevel = 1; // only a PIN/pattern
    expect(await quickLoginKind()).toMatchObject({ available: true, label: 'phone PIN' });
    mockLevel = 0;
    expect((await quickLoginKind()).available).toBe(false);
  });

  it('is offered once after a password login, then not again', async () => {
    expect(await shouldOfferQuickLogin()).toBe(true);
    await enableQuickLogin('jane@example.com', 'Braamfun9!');
    expect(await shouldOfferQuickLogin()).toBe(false);
  });

  it('only saves the login once the phone confirms the owner', async () => {
    mockAuth = { success: false, error: 'user_cancel' };
    expect(await enableQuickLogin('jane@example.com', 'Braamfun9!')).toBe('cancelled');
    expect(await quickLoginEmail()).toBeNull();
    mockAuth = { success: true };
    expect(await enableQuickLogin('jane@example.com', 'Braamfun9!')).toBe('ok');
    expect(await quickLoginEmail()).toBe('jane@example.com');
  });

  it('hands back the login only after the fingerprint matches', async () => {
    await enableQuickLogin('jane@example.com', 'Braamfun9!');
    mockAuth = { success: false, error: 'authentication_failed' };
    expect(await unlockSavedLogin()).toEqual({ result: 'failed' });
    mockAuth = { success: true };
    expect(await unlockSavedLogin()).toEqual({ result: 'ok', email: 'jane@example.com', password: 'Braamfun9!' });
  });

  it('forgets the saved login when the password has changed', async () => {
    await enableQuickLogin('jane@example.com', 'Braamfun9!');
    expect(await forgetIfStale({ code: 'auth/network-request-failed' })).toBe(false);
    expect(await quickLoginEmail()).toBe('jane@example.com');
    expect(await forgetIfStale({ code: 'auth/invalid-credential' })).toBe(true);
    expect(await quickLoginEmail()).toBeNull();
    expect(await unlockSavedLogin()).toEqual({ result: 'missing' });
  });
});
