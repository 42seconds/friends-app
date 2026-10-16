import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import T from './T';
import { useOnline } from '../../hooks/useOnline';
import { night } from '../../theme/night';

// A small pill at the top of every screen while the phone is offline.
// Saved events, tickets and QR codes keep working underneath.
export default function OfflineBanner() {
  const online = useOnline();
  const insets = useSafeAreaInsets();
  if (online) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: insets.top + 6, left: 0, right: 0, alignItems: 'center', zIndex: 100 }} accessibilityLiveRegion="polite">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 30, borderRadius: 99, backgroundColor: night.ink, borderWidth: 1, borderColor: night.ink2 }}>
        <Ionicons name="cloud-offline-outline" size={14} color={night.yellow} />
        <T size={12} weight="600" color={night.paper}>Offline · showing saved info</T>
      </View>
    </View>
  );
}
