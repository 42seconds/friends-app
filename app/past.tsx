import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { T, H1, Screen, TopBar, SectionLabel, EventRow, Pill, EmptyState, PrimaryButton } from '../src/components/night';
import { useEvents } from '../src/hooks/useEvents';
import { useBookings } from '../src/hooks/useBookings';
import { dateParts } from '../src/lib/dates';
import { night } from '../src/theme/night';
import { Event } from '../src/types';

// Past events grouped by month, with "You went" on nights you booked.
export default function PastEventsScreen() {
  const router = useRouter();
  const { past } = useEvents();
  const { tickets } = useBookings();
  const went = new Set(tickets.filter((t) => t.status === 'confirmed').map((t) => t.eventId));

  const groups: { month: string; events: Event[] }[] = [];
  for (const e of past) {
    const m = dateParts(e.date, e.time)?.monthYear ?? 'EARLIER';
    const g = groups.find((x) => x.month === m);
    if (g) g.events.push(e);
    else groups.push({ month: m, events: [e] });
  }

  return (
    <Screen>
      <TopBar />
      <H1 size={60}>Past{'\n'}events</H1>
      <T size={15} color={night.body}>Relive the nights. Find yourself in the photos.</T>
      {!groups.length && (
        <EmptyState icon="images-outline" title="Nothing yet" body="Once events have happened, they'll live here with their photos.">
          <PrimaryButton label="See what's on" onPress={() => router.replace('/(tabs)/home')} />
        </EmptyState>
      )}
      {groups.map((g) => (
        <View key={g.month} style={{ gap: 10 }}>
          <SectionLabel>{g.month}</SectionLabel>
          {g.events.map((e) => (
            <EventRow
              key={e.id}
              title={e.title}
              subtitle={e.gallery?.length ? `${e.gallery.length} photos` : e.location}
              image={e.image}
              tag={e.tag}
              date={e.date}
              time={e.time}
              onPress={() => router.push(`/gallery/${e.id}`)}
              right={went.has(e.id) ? <Pill label="You went" bg={night.lime} /> : undefined}
            />
          ))}
        </View>
      ))}
    </Screen>
  );
}
