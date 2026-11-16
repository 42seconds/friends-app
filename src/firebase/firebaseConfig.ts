import { initializeApp } from 'firebase/app';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// getReactNativePersistence only exists in firebase/auth's React Native
// build (which Metro picks); the default typings are the web ones.
// @ts-ignore
import { getAuth, initializeAuth, getReactNativePersistence, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyAdjLSIIBZkInBm2Xc2cVpf47olh6G4WhQ",
  authDomain: "andfriends-c5552.firebaseapp.com",
  projectId: "andfriends-c5552",
  storageBucket: "andfriends-c5552.firebasestorage.app",
  messagingSenderId: "518106146797",
  appId: "1:518106146797:web:51aa340e1840e54c7de9e4",
  measurementId: "G-0C0YYTYW2S"
};

const app = initializeApp(firebaseConfig);
// Keep people logged in between app launches on phones.
export const auth = Platform.OS === 'web' ? getAuth(app) : initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
export const db = getFirestore(app);
export const storage = getStorage(app);

// Local practice database: start the app with EXPO_PUBLIC_FIREBASE_EMULATOR=1
// (and `firebase emulators:start --only auth,firestore`) to use the
// Firebase emulators on this computer instead of the live project.
if (process.env.EXPO_PUBLIC_FIREBASE_EMULATOR === '1') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8085);
}

// Cloud Functions (functions/index.js): one-time codes sent by email.
export const functions = getFunctions(app, 'us-central1');
if (process.env.EXPO_PUBLIC_FIREBASE_EMULATOR === '1') {
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);
}
