import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import T from './T';
import { night } from '../../theme/night';
import { canPromptInstall, isInstalled, onInstallChange, promptInstall, webDevice } from '../../lib/pwa';

const KEY = 'installHintDismissed';

// True on a phone's browser (iPhone or Android) until the app has been
// added to the home screen.
export function shouldOfferInstall(): boolean {
  return webDevice() !== 'other' && !isInstalled();
}

function Step({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <T mono weight="700" size={12} color={night.orange}>{n}</T>
      <T size={14} color={night.paper} style={{ flex: 1 }}>{children}</T>
    </View>
  );
}

// People on the website get a card on Explore showing how to put the app
// on their home screen, so it opens like an app and works without signal.
export default function InstallHint() {
  const [show, setShow] = useState(false);
  const [, rerender] = useState(0);
  const device = webDevice();

  useEffect(() => {
    if (!shouldOfferInstall()) return;
    AsyncStorage.getItem(KEY)
      .then((v) => setShow(v !== '1'))
      .catch(() => setShow(true));
    return onInstallChange(() => rerender((n) => n + 1));
  }, []);

  if (!show || isInstalled()) return null;

  const dismiss = () => {
    setShow(false);
    AsyncStorage.setItem(KEY, '1').catch(() => {});
  };

  const install = async () => {
    if (await promptInstall()) setShow(false);
  };

  return (
    <View style={{ padding: 16, borderRadius: 20, backgroundColor: night.ink, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: night.orange, alignItems: 'center', justifyContent: 'center' }}>
          <T display size={30} color={night.ink}>&amp;</T>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <T size={15} weight="700" color={night.paper}>Get the app on your phone</T>
          <T size={13} color={night.inkMuted}>Free, no app store. Opens full screen and works without signal.</T>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Hide this tip" onPress={dismiss} hitSlop={10} style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="close" size={20} color={night.inkMuted} />
        </Pressable>
      </View>

      {device === 'android' && canPromptInstall() ? (
        <Pressable accessibilityRole="button" onPress={install} style={({ pressed }) => ({ height: 48, borderRadius: 14, backgroundColor: night.orange, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: pressed ? 0.85 : 1 })}>
          <Ionicons name="download-outline" size={18} color={night.ink} />
          <T size={15} weight="700" color={night.ink}>Install the app</T>
        </Pressable>
      ) : device === 'android' ? (
        <View style={{ gap: 8 }}>
          <Step n="1">Tap <Ionicons name="ellipsis-vertical" size={15} color={night.paper} /> in Chrome's top bar</Step>
          <Step n="2">Choose "Add to Home screen" or "Install app"</Step>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          <Step n="1">Tap <Ionicons name="share-outline" size={16} color={night.paper} /> Share in Safari (or Chrome)</Step>
          <Step n="2">Choose "Add to Home Screen", then "Add"</Step>
        </View>
      )}
    </View>
  );
}
