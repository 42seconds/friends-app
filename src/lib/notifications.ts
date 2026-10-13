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

type NotificationsModule = typeof import('expo-notifications');
let mod: NotificationsModule | null = null;
function notifications(): NotificationsModule | null {
  if (unsupported || Platform.OS === 'web') return null;
  if (!mod) {
    try {
      mod = require('expo-notifications');
      mod!.setNotificationHandler({
        handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
      });
      if (Platform.OS === 'android') {
        mod!.setNotificationChannelAsync('tickets', { name: 'Tickets', importance: mod!.AndroidImportance.HIGH, vibrationPattern: [0, 200, 120, 200], lightColor: '#C8F03C' }).catch(() => {});
      }
    } catch {
      mod = null;
    }
  }
  return mod;
}

// Shows a notification on this phone right away. `url` is opened when
// the person taps it. Quietly does nothing without permission.
export async function notifyNow(title: string, body: string, url?: string) {
  const N = notifications();
  if (!N) return;
  try {
    const { granted } = await N.getPermissionsAsync();
    if (!granted) return;
    await N.scheduleNotificationAsync({
      content: { title, body, data: url ? { url } : {}, sound: 'default' },
      trigger: Platform.OS === 'android' ? { channelId: 'tickets' } as any : null,
    });
  } catch {
    // Notifications are a nice-to-have; the Inbox still has the update.
  }
}

// Opens the screen a notification points to when it's tapped (including
// the tap that launched the app). Returns a cleanup function.
export function handleNotificationTaps(open: (url: string) => void): () => void {
  const N = notifications();
  if (!N) return () => {};
  const go = (r: { notification: { request: { content: { data?: any } } } } | null) => {
    const url = r?.notification.request.content.data?.url;
    if (typeof url === 'string') open(url);
  };
  // The tap that launched the app: handle it once, then forget it so the
  // next launch doesn't jump to the same screen again.
  N.getLastNotificationResponseAsync()
    .then((r) => {
      if (!r) return;
      setTimeout(() => go(r), 600);
      N.clearLastNotificationResponseAsync().catch(() => {});
    })
    .catch(() => {});
  const sub = N.addNotificationResponseReceivedListener(go);
  return () => sub.remove();
}
