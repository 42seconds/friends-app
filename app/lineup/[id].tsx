import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T, H1, Amp, Screen, Hero, TopBar, IconButton, ListGroup, ToggleRow } from '../../src/components/night';
import { useEvent } from '../../src/hooks/useEvents';
import { prefsStore } from '../../src/store';
import { shortDate } from '../../src/lib/dates';
import { subBrandFor } from '../../src/lib/subbrands';
import { night } from '../../src/theme/night';
import { LineupEntry } from '../../src/types';

// Accepts "20:30 · Selector Nala · Warm-up", plain names, or objects.
function parseSlot(entry: LineupEntry) {
  if (typeof entry !== 'string') return entry;
  const parts = entry.split(/\s[·|-]\s/).map((s) => s.trim());
  if (parts.length > 1 && /^\d{1,2}[:h]\d{2}$/.test(parts[0])) return { time: parts[0], name: parts[1], note: parts.slice(2).join(' · ') };
  return { name: parts[0], note: parts.slice(1).join(' · ') };
}

export default function LineupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { event } = useEvent(id);
  const prefs = prefsStore.useStore();
  const brand = subBrandFor(event?.tag);
  const slots = (event?.lineup ?? []).map(parseSlot);
  const eventReminders = prefs.lineupReminders.filter((k) => k.startsWith(`${id}:`));
  const allOn = slots.length > 0 && eventReminders.length === slots.length;

  const toggleSlot = (i: number) => {
    const key = `${id}:${i}`;
    prefsStore.set({ lineupReminders: prefs.lineupReminders.includes(key) ? prefs.lineupReminders.filter((k) => k !== key) : [...prefs.lineupReminders, key] });
  };
  const toggleAll = (on: boolean) => {
    const others = prefs.lineupReminders.filter((k) => !k.startsWith(`${id}:`));
    prefsStore.set({ lineupReminders: on ? [...others, ...slots.map((_, i) => `${id}:${i}`)] : others });
  };

  return (
    <Screen header={<TopBar dark />} headerBg={brand.color}
      padTop={false}
      hero={
        <Hero bg={brand.color} gap={12}>
          <Amp size={300} color={brand.deep} style={{ right: -40, top: 0 }} />
          <T mono weight="700" size={11} style={{ marginTop: 30 }}>{`${shortDate(event?.date, event?.time)} · ${event?.location ?? ''}`.toUpperCase()}</T>
          <H1 size={72}>Lineup</H1>
        </Hero>
      }
    >
      <ListGroup>
        <ToggleRow title="Remind me before each set" subtitle="Saved on this phone" value={allOn} onChange={toggleAll} />
      </ListGroup>
      {event?.time && (
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <T mono weight="700" size={13} style={{ width: 48, paddingTop: 16 }}>{event.time}</T>
          <View style={{ flex: 1, padding: 14, borderRadius: 18, backgroundColor: night.card, borderWidth: 1.5, borderColor: night.line }}>
            <T size={16} weight="600">Doors open</T>
          </View>
        </View>
      )}
      {slots.map((s, i) => {
        const on = prefs.lineupReminders.includes(`${id}:${i}`);
        return (
          <View key={i} style={{ flexDirection: 'row', gap: 12 }}>
            <T mono weight="700" size={13} style={{ width: 48, paddingTop: 16 }}>{s.time ?? ''}</T>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 18, backgroundColor: night.card, borderWidth: 1.5, borderColor: night.line }}>
              <View style={{ flex: 1, gap: 2 }}>
                <T size={16} weight="600">{s.name}</T>
                {!!s.note && <T size={13} color={night.muted}>{s.note}</T>}
              </View>
              <IconButton icon={on ? 'notifications' : 'notifications-outline'} label={on ? `Stop reminder for ${s.name}` : `Remind me for ${s.name}`} tone={on ? 'ink' : 'light'} size={18} onPress={() => toggleSlot(i)} />
            </View>
          </View>
        );
      })}
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="information-circle-outline" size={16} color={night.muted} />
        <T size={13} color={night.muted}>Times can shift on the night.</T>
      </View>
    </Screen>
  );
}
