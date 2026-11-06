import { useEffect, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import T from './T';
import { night } from '../../theme/night';

const KEY = 'installHintDismissed';

// True in Safari on an iPhone or iPad, but not once the app has been added
// to the home screen (it then runs full screen, "standalone").
export function shouldOfferInstall(): boolean {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const iOS = /iPhone|iPad|iPod/.test(ua) || (ua.includes('Macintosh') && (navigator as any).maxTouchPoints > 1);
  const standalone = (navigator as any).standalone === true || (typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)').matches);
  return iOS && !standalone;
}

// iPhone users get the app from the website. This card on Explore shows
// them how to put it on their home screen so it opens like an app.
export default function InstallHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!shouldOfferInstall()) return;
    AsyncStorage.getItem(KEY)
      .then((v) => setShow(v !== '1'))
      .catch(() => setShow(true));
  }, []);

  if (!show) return null;

  const dismiss = () => {
    setShow(false);
    AsyncStorage.setItem(KEY, '1').catch(() => {});
  };

  return (
    <View style={{ padding: 16, borderRadius: 20, backgroundColor: night.ink, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: night.orange, alignItems: 'center', justifyContent: 'center' }}>
          <T display size={30} color={night.ink}>&amp;</T>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <T size={15} weight="700" color={night.paper}>Get the app on your iPhone</T>
          <T size={13} color={night.inkMuted}>Add it to your home screen. Free, no App Store needed.</T>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Hide this tip" onPress={dismiss} hitSlop={10} style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="close" size={20} color={night.inkMuted} />
        </Pressable>
      </View>
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <T mono weight="700" size={12} color={night.orange}>1</T>
          <T size={14} color={night.paper} style={{ flex: 1 }}>
            Tap <Ionicons name="share-outline" size={16} color={night.paper} /> Share in Safari's bar
          </T>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <T mono weight="700" size={12} color={night.orange}>2</T>
          <T size={14} color={night.paper} style={{ flex: 1 }}>Choose "Add to Home Screen", then "Add"</T>
        </View>
      </View>
    </View>
  );
}
