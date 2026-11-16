import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

// Quick sign-in: log in with a fingerprint, face or the phone's own
// PIN/pattern instead of typing the password.
//
// After a normal password login, the app offers to turn it on. The email
// and password are then kept in the phone's secure storage (Android
// Keystore / iOS Keychain, encrypted, this device only) and only read
// after the phone has confirmed it's you. Phones only; not on the web.
const KEY = 'andfriends.quickLogin';
const ASKED_KEY = 'quickLoginAsked';
const STORE_OPTS: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

export type QuickKind = { available: boolean; label: string; icon: 'finger-print' | 'scan-outline' | 'keypad-outline' };

const NONE: QuickKind = { available: false, label: '', icon: 'finger-print' };

// What this phone can use: fingerprint, face, or its PIN/pattern.
export async function quickLoginKind(): Promise<QuickKind> {
  if (Platform.OS === 'web') return NONE;
  try {
    const level = await LocalAuthentication.getEnrolledLevelAsync();
    if (level === LocalAuthentication.SecurityLevel.NONE) return NONE;
    if (level >= LocalAuthentication.SecurityLevel.BIOMETRIC_WEAK) {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return { available: true, label: 'fingerprint', icon: 'finger-print' };
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return { available: true, label: Platform.OS === 'ios' ? 'Face ID' : 'face unlock', icon: 'scan-outline' };
    }
    return { available: true, label: 'phone PIN', icon: 'keypad-outline' };
  } catch {
    return NONE;
  }
}

type Saved = { email: string; password: string };

async function readSaved(): Promise<Saved | null> {
  try {
    const raw = await SecureStore.getItemAsync(KEY, STORE_OPTS);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}

// The email quick sign-in is set up for on this phone (no password).
export async function quickLoginEmail(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  return (await readSaved())?.email ?? null;
}

// Asks the phone to confirm it's the owner. Falls back to the phone's
// PIN/pattern when the fingerprint doesn't work.
export async function confirmOwner(reason: string): Promise<'ok' | 'cancelled' | 'failed'> {
  const r = await LocalAuthentication.authenticateAsync({ promptMessage: reason, cancelLabel: 'Cancel', disableDeviceFallback: false });
  if (r.success) return 'ok';
  return r.error === 'user_cancel' || r.error === 'system_cancel' || r.error === 'app_cancel' ? 'cancelled' : 'failed';
}

export async function enableQuickLogin(email: string, password: string): Promise<'ok' | 'cancelled' | 'failed'> {
  const r = await confirmOwner('Turn on quick sign-in for &friends');
  if (r !== 'ok') return r;
  await SecureStore.setItemAsync(KEY, JSON.stringify({ email: email.trim(), password }), STORE_OPTS);
  await AsyncStorage.setItem(ASKED_KEY, '1').catch(() => {});
  return 'ok';
}

export async function disableQuickLogin() {
  await SecureStore.deleteItemAsync(KEY, STORE_OPTS).catch(() => {});
}

// After the phone confirms it's you, hands back the saved login.
export async function unlockSavedLogin(): Promise<{ result: 'ok'; email: string; password: string } | { result: 'cancelled' | 'failed' | 'missing' }> {
  const saved = await readSaved();
  if (!saved) return { result: 'missing' };
  const r = await confirmOwner('Sign in to &friends');
  if (r !== 'ok') return { result: r };
  return { result: 'ok', ...saved };
}

// Offer it once per phone, after a password login.
export async function shouldOfferQuickLogin(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if ((await AsyncStorage.getItem(ASKED_KEY).catch(() => null)) === '1') return false;
  if (await readSaved()) return false;
  return (await quickLoginKind()).available;
}

export async function markQuickLoginAsked() {
  await AsyncStorage.setItem(ASKED_KEY, '1').catch(() => {});
}

// The saved password stopped working (changed or reset): forget it.
export async function forgetIfStale(err: any) {
  const code = String(err?.code ?? '');
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found') || code.includes('user-disabled')) {
    await disableQuickLogin();
    return true;
  }
  return false;
}
