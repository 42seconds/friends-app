import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { arrayUnion, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

// Push notifications reach the phone even when the app is closed.
// Each phone gets an Expo push token, saved on users/{uid}.pushTokens.
// When staff approve or reject a booking, the app sends the message to
// those tokens through Expo's push service (which uses Firebase Cloud
// Messaging on Android and APNs on iOS). See docs/push-notifications.md.

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const inExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let ready = false;
// True once this phone has a push token, so pushes cover it while the app
// is in the background.
export const pushReady = () => ready;

// Saves this phone's push token on the user's profile. Quietly does
// nothing in Expo Go, on the web, without permission, or before push is
// set up for the build (Android needs google-services.json).
export async function registerPushToken(uid: string): Promise<string | null> {
  if (Platform.OS === 'web' || (inExpoGo && Platform.OS === 'android')) return null;
  try {
    const N: typeof import('expo-notifications') = require('expo-notifications');
    const { granted } = await N.getPermissionsAsync();
    if (!granted) return null;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const { data: token } = await N.getExpoPushTokenAsync({ projectId });
    await updateDoc(doc(db, 'users', uid), { pushTokens: arrayUnion(token) });
    ready = true;
    return token;
  } catch (e: any) {
    console.warn('Push not available on this build:', e?.message ?? e);
    return null;
  }
}

export interface PushMessage {
  title: string;
  body: string;
  url?: string;
}

// Expo's push service takes up to 100 messages per request.
export function buildPushRequest(tokens: string[], m: PushMessage) {
  return tokens
    .filter((t) => /^Expo(nent)?PushToken\[.+\]$/.test(t))
    .slice(0, 100)
    .map((to) => ({ to, title: m.title, body: m.body, sound: 'default', channelId: 'tickets', priority: 'high', data: m.url ? { url: m.url } : {} }));
}

// Sends a push to every phone the person is logged in on.
export async function pushToUser(uid: string, m: PushMessage) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    const tokens: string[] = snap.exists() ? snap.data().pushTokens ?? [] : [];
    const messages = buildPushRequest(tokens, m);
    if (!messages.length) return;
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });
  } catch (e: any) {
    // The guest still sees the change in the app and their Inbox.
    console.warn('Push send failed:', e?.message ?? e);
  }
}
