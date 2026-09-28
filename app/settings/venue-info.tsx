import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { T, H1, H2, Screen, TopBar, Card, SectionLabel, ListGroup, ListRow, IconName } from '../../src/components/night';
import { openMap } from '../../src/lib/booking';
import { night } from '../../src/theme/night';

// PLACEHOLDERS: fill in the real hours, capacities and address.
const HOURS = [
  ['Mon to Thu', '[HOURS]'],
  ['Friday', '[HOURS]'],
  ['Saturday', '[HOURS]'],
  ['Sunday', '[HOURS]'],
];
const ROOMS: { name: string; blurb: string; icon: IconName; bg: string }[] = [
  { name: 'Main floor', blurb: 'Sound system, bar, dance floor', icon: 'musical-notes', bg: night.orange },
  { name: 'Rooftop', blurb: 'City views, sundowners, talks', icon: 'sunny', bg: night.blue },
  { name: 'Gallery room', blurb: 'Exhibitions, markets, workshops', icon: 'easel', bg: night.yellow },
];
const ADDRESS = '[STREET ADDRESS], Braamfontein';

export default function VenueInfoScreen() {
  return (
    <Screen>
      <TopBar />
      <H1 size={60}>Visit{'\n'}&amp;Friends</H1>
      <Card>
        <T size={13} color={night.muted}>Hours vary on event nights</T>
        {HOURS.map(([d, h]) => (
          <View key={d} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <T size={14}>{d}</T>
            <T mono size={14}>{h}</T>
          </View>
        ))}
      </Card>
      <H2>The rooms</H2>
      {ROOMS.map((r) => (
        <View key={r.name} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 10, borderRadius: 18, backgroundColor: night.card, borderWidth: 1.5, borderColor: night.line }}>
          <View style={{ width: 64, height: 64, borderRadius: 14, backgroundColor: r.bg, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={r.icon} size={26} color={night.ink} />
          </View>
          <View style={{ flex: 1 }}>
            <T size={16} weight="600">{r.name}</T>
            <T size={13} color={night.muted}>{r.blurb}</T>
          </View>
        </View>
      ))}
      <SectionLabel>HOUSE RULES</SectionLabel>
      <ListGroup>
        <ListRow icon="card-outline" title="Bring ID" subtitle="Night events are 18+" />
        <ListRow icon="wine-outline" title="No outside drinks" />
        <ListRow icon="heart-outline" title="Look out for each other" subtitle="Find any staff member if you need help" />
      </ListGroup>
      <Pressable accessibilityRole="button" onPress={() => openMap(`${ADDRESS}, Johannesburg`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 20, backgroundColor: night.ink }}>
        <Ionicons name="location" size={22} color={night.orange} />
        <View style={{ flex: 1 }}>
          <T size={15} weight="600" color={night.paper}>{ADDRESS}</T>
          <T size={13} color={night.inkMuted}>Open map and directions</T>
        </View>
        <Ionicons name="arrow-forward" size={20} color={night.orange} />
      </Pressable>
    </Screen>
  );
}
