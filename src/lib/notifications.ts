import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { prefsStore } from '../store';

// Expo Go on Android (SDK 53+) crashes as soon as expo-notifications is
// loaded, so it is only required here, and never inside Expo Go on
// Android. Development and store builds work normally.
const unsupported = Platform.OS === 'android' && Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Asks the OS for permission and records the choice in preferences.
export async function enablePushNotifications(): Promise<boolean> {
  if (unsupported || Platform.OS === 'web') {
    prefsStore.set({ push: true });
    return true;
  }
  try {
    const Notifications: typeof import('expo-notifications') = require('expo-notifications');
    const current = await Notifications.getPermissionsAsync();
    const granted = current.granted || (await Notifications.requestPermissionsAsync()).granted;
    prefsStore.set({ push: granted });
    return granted;
  } catch {
    prefsStore.set({ push: false });
    return false;
  }
}
