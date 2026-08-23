import AsyncStorage from '@react-native-async-storage/async-storage';

// One key, one job: remember whether this device has seen the onboarding
// slides before. This is a DEVICE flag, not a per-account flag — it lives
// in AsyncStorage (local to the phone), not Firestore. Logging in on a
// different device would show onboarding again, which is correct.
const ONBOARDING_KEY = 'hasSeenOnboarding';

export async function getHasSeenOnboarding(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDING_KEY);
  return value === 'true';
}

export async function setHasSeenOnboarding(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
}