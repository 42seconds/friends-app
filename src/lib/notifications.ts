import * as Notifications from 'expo-notifications';
import { prefsStore } from '../store';

// Asks the OS for permission and records the choice in preferences.
export async function enablePushNotifications(): Promise<boolean> {
  try {
    const current = await Notifications.getPermissionsAsync();
    const granted = current.granted || (await Notifications.requestPermissionsAsync()).granted;
    prefsStore.set({ push: granted });
    return granted;
  } catch {
    prefsStore.set({ push: false });
    return false;
  }
}
