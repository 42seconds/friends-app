import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T, H2, Screen, IconButton, MapArt, PrimaryButton, TextLink, IconName } from '../../src/components/night';
import { useEvent } from '../../src/hooks/useEvents';
import { openDirections, TravelMode } from '../../src/lib/booking';
import { night } from '../../src/theme/night';
import { safeBack } from '../../src/lib/nav';

const MODES: { key: TravelMode; icon: IconName; label: string }[] = [
  { key: 'walking', icon: 'walk', label: 'Walk' },
  { key: 'driving', icon: 'car', label: 'Drive' },
  { key: 'transit', icon: 'bus', label: 'Transit' },
];

// Route to the venue: pick how you're getting there, then open Maps.
export default function DirectionsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { event } = useEvent(id);
  const [mode, setMode] = useState<TravelMode>('walking');
  const dest = event?.address ?? `${event?.location ?? ''}, Braamfontein, Johannesburg`;

  return (
    <Screen
      padTop={false}
      headerBg={night.sand}
      header={<IconButton icon="arrow-back" label="Back" onPress={() => safeBack(router)} />}
      hero={
        <View>
          <MapArt height={400} route />
          <View style={{ position: 'absolute', top: 12, left: 20, right: 20, gap: 10 }}>
            <View style={{ padding: 12, borderRadius: 18, backgroundColor: night.card, gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 10, height: 10, borderRadius: 99, backgroundColor: night.blue }} />
                <T size={14}>Your location</T>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: night.orange }} />
                <T size={14} weight="600">{event?.location}</T>
              </View>
            </View>
          </View>
        </View>
      }
      contentStyle={{ marginTop: -24, backgroundColor: night.paper, borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
      footer={
        <>
          <PrimaryButton label="Open in Maps" onPress={() => openDirections(dest, mode)} />
          <TextLink label="See the venue on the map" onPress={() => router.push(`/map/${id}`)} />
        </>
      }
    >
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {MODES.map((m) => {
          const on = mode === m.key;
          return (
            <Pressable key={m.key} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => setMode(m.key)} style={{ flex: 1, height: 64, borderRadius: 16, backgroundColor: on ? night.ink : night.card, borderWidth: on ? 0 : 1.5, borderColor: night.line, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <Ionicons name={m.icon} size={20} color={on ? night.orange : night.ink} />
              <T size={13} weight="600" color={on ? night.paper : night.ink}>{m.label}</T>
            </Pressable>
          );
        })}
      </View>
      <H2 size={32}>{MODES.find((m) => m.key === mode)!.label} to {event?.location}</H2>
      <T size={14} color={night.body}>{dest}</T>
      {mode === 'walking' && (
        <View style={{ flexDirection: 'row', gap: 12, padding: 14, borderRadius: 18, backgroundColor: night.ink }}>
          <Ionicons name="people-outline" size={22} color={night.lime} />
          <T size={14} lh={1.5} color={night.paper} style={{ flex: 1 }}>Walking late? Share your live location with a friend from your Maps app.</T>
        </View>
      )}
    </Screen>
  );
}
