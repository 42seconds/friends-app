import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { T, H1, Amp, IconButton, PrimaryButton, TextLink } from '../src/components/night';
import { enablePushNotifications } from '../src/lib/notifications';
import { night } from '../src/theme/night';

const SAMPLES = [
  { color: night.orange, when: 'now', title: 'Your ticket is ready', body: 'Payment approved. Your QR is in the app.', bg: 'rgba(243,240,232,0.96)', tilt: '-1deg' },
  { color: night.blue, when: '2h ago', title: 'A spot just opened', body: 'You have 30 min to claim it from the waitlist.', bg: 'rgba(243,240,232,0.88)', tilt: '1deg' },
  { color: night.yellow, when: 'Sun', title: 'Doors in 1 hour', body: 'See you there. Bring a bag!', bg: 'rgba(243,240,232,0.78)', tilt: '-0.5deg' },
];

// Shown right after sign-up: explain what we notify about, then ask.
export default function NotificationsOptIn() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const done = () => router.replace('/(tabs)/home');

  return (
    <View style={{ flex: 1, backgroundColor: night.ink, paddingTop: insets.top + 12, overflow: 'hidden' }}>
      <StatusBar style="light" />
      <Amp size={520} color={night.ink2} style={{ right: -120, top: 40 }} />
      <View style={{ paddingHorizontal: 20 }}>
        <IconButton icon="arrow-back" label="Back" tone="dark" onPress={done} />
      </View>
      <View style={{ paddingHorizontal: 20, paddingTop: 30, gap: 10 }} accessibilityLabel="Example notifications">
        {SAMPLES.map((n) => (
          <View key={n.title} style={{ flexDirection: 'row', gap: 12, padding: 14, borderRadius: 20, backgroundColor: n.bg, transform: [{ rotate: n.tilt }] }}>
            <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: n.color, alignItems: 'center', justifyContent: 'center' }}>
              <T display size={24}>&amp;</T>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <T size={12} weight="600" color={night.muted}>&amp;friends</T>
                <T size={12} color={night.muted}>{n.when}</T>
              </View>
              <T size={15} weight="700">{n.title}</T>
              <T size={13} color={night.body}>{n.body}</T>
            </View>
          </View>
        ))}
      </View>
      <View style={{ marginTop: 'auto', paddingHorizontal: 24, paddingBottom: insets.bottom + 24, gap: 12 }}>
        <H1 size={60} color={night.paper}>Never miss{'\n'}the drop</H1>
        <T size={15} lh={1.5} color={night.inkMuted}>We only ping you about your tickets, waitlist spots and events you picked. No spam.</T>
        <PrimaryButton
          tone="orange"
          label="Turn on notifications"
          icon="notifications"
          arrow={false}
          center
          onPress={async () => {
            await enablePushNotifications();
            done();
          }}
        />
        <TextLink label="Maybe later" color={night.inkMuted} onPress={done} />
      </View>
    </View>
  );
}
