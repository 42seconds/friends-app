import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useEvents } from '../../src/hooks/useEvents';
import EventCard from '../../src/components/eventCard';

export default function HomeScreen() {
  const { events, loading } = useEvents();
  const router = useRouter();

  // While Firestore is still loading the first batch of events,
  // show a spinner instead of an empty-looking screen.
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#C1502E" />
      </View>
    );
  }

  // Explicit empty state — better than just showing a blank white screen
  // if there genuinely are zero published events yet.
  if (events.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No events available right now.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Events</Text>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EventCard
            event={item}
            // Navigates to app/event/[id].tsx, passing this event's
            // Firestore ID as the dynamic route param. We build that
            // screen next.
            onPress={() => router.push(`/event/${item.id}`)}
          />
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', paddingTop: 16 },
  header: { fontSize: 28, fontWeight: 'bold', color: '#000000', paddingHorizontal: 16, marginBottom: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  emptyText: { color: '#555555' },
});