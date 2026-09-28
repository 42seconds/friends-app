import { initializeApp } from 'firebase/app';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// getReactNativePersistence only exists in firebase/auth's React Native
// build (which Metro picks); the default typings are the web ones.
// @ts-ignore
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

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



