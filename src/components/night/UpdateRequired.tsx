import { Linking, View } from 'react-native';
import { support } from '../../config/payment';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import T from './T';
import { H1 } from './Display';
import { PrimaryButton } from './Buttons';
import { night } from '../../theme/night';

// Blocking screen when this build is too old to book or scan safely.
export default function UpdateRequired() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: night.orange, paddingTop: insets.top + 60, paddingHorizontal: 24, paddingBottom: insets.bottom + 24, gap: 18 }}>
      <StatusBar style="dark" />
      <View style={{ width: 88, height: 88, borderRadius: 26, backgroundColor: night.ink, alignItems: 'center', justifyContent: 'center' }}>
        <T display size={56} color={night.orange}>&amp;</T>
      </View>
      <H1 size={72}>Time for{'\n'}an update</H1>
      <T size={16} lh={1.5}>This version is too old to book or scan safely. It takes a minute.</T>
      <View style={{ marginTop: 'auto', gap: 12 }}>
        <PrimaryButton label="Update now" onPress={() => Linking.openURL(support.appStoreUrl)} />
        <T size={13} center>Your tickets are safe. Nothing is lost when you update.</T>
      </View>
    </View>
  );
}
