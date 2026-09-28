import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T, H1, Screen, Segmented, Note, EmptyState, PrimaryButton, EventThumb, Pill } from '../../src/components/night';
import { useEvents } from '../../src/hooks/useEvents';
import { savedStore, toggleSaved } from '../../src/store';
import { eventHref, priceLine } from '../../src/components/night/EventCards';
import { isPast, shortDate } from '../../src/lib/dates';
import { night } from '../../src/theme/night';
import { Event } from '../../src/types';

function SavedCard({ e }: { e: Event }) {
  const router = useRouter();
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push(eventHref(e) as any)} style={{ flexDirection: 'row', gap: 14, alignItems: 'center', padding: 10, borderRadius: 20, backgroundColor: night.card, borderWidth: 1.5, borderColor: night.line }}>
      <EventThumb image={e.image} tag={e.tag} size={88} radius={16} />
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
          <T display size={24} lh={1} style={{ flex: 1 }}>{e.title}</T>
          <Pressable accessibilityLabel="Remove from saved" hitSlop={10} onPress={() => toggleSaved(e.id)}>
            <Ionicons name="heart" size={22} color={night.orange} />
          </Pressable>
        </View>
        <T size={13} color={night.muted}>{shortDate(e.date, e.time)} · {e.soldOut ? 'Sold out' : priceLine(e)}</T>
        {e.soldOut && <Pill label="Join the waitlist" bg={night.blue} />}
      </View>
    </Pressable>
  );
}

export default function SavedScreen() {
  const router = useRouter();
  const { events } = useEvents();
  const { ids } = savedStore.useStore();
  const [tab, setTab] = useState<'upcoming' | 'ended'>('upcoming');

  const saved = ids.map((id) => events.find((e) => e.id === id)).filter((e): e is Event => !!e);
  const upcoming = saved.filter((e) => !isPast(e.date, e.time));
  const ended = saved.filter((e) => isPast(e.date, e.time));
  const list = tab === 'upcoming' ? upcoming : ended;

  return (
    <Screen tabBar>
      <H1 size={60}>Saved</H1>
      {saved.length === 0 ? (
        <EmptyState icon="heart-outline" iconColor={night.orange} title="Nothing saved" body="Tap the heart on any event to keep it here.">
          <PrimaryButton label="Browse events" onPress={() => router.push('/(tabs)/home')} />
        </EmptyState>
      ) : (
        <>
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { key: 'upcoming', label: `Upcoming · ${upcoming.length}` },
              { key: 'ended', label: `Ended · ${ended.length}` },
            ]}
          />
          <Note icon="heart-outline">Saved events stay on this phone. Book early, popular nights sell out.</Note>
          <View style={{ gap: 10 }}>
            {list.map((e) => (
              <SavedCard key={e.id} e={e} />
            ))}
            {!list.length && <T size={14} color={night.muted} center>Nothing here yet.</T>}
          </View>
        </>
      )}
    </Screen>
  );
}
