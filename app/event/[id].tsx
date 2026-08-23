import { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getEventById } from '../../src/services/eventService';
import { Event } from '../../src/types';

export default function EventDetailScreen() {
  // Pulls the "id" segment out of the URL, e.g. /event/areece-123 -> "areece-123"
  // Matches the router.push(`/event/${item.id}`) call from HomeScreen.
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Guard: if somehow no id is present, don't attempt the fetch.
    if (!id) return;

    getEventById(id).then((data) => {
      setEvent(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#C1502E" />
      </View>
    );
  }

  // Handles both "still loading" and "id was invalid / event deleted" cases.
  if (!event) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Event not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        {event.image ? (
          <Image source={{ uri: event.image }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]} />
        )}

        <View style={styles.content}>
          <Text style={styles.tag}>{event.tag}</Text>
          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.meta}>{event.date} · {event.time}</Text>
          <Text style={styles.meta}>{event.location}</Text>
          <Text style={styles.description}>{event.description}</Text>

          {/* Lineup only renders if the array actually has entries —
              your schema shows lineup can be empty []. */}
          {event.lineup?.length > 0 && (
            <>
              <Text style={styles.sectionHeader}>Lineup</Text>
              {event.lineup.map((artist, i) => (
                <Text key={i} style={styles.lineupItem}>{artist}</Text>
              ))}
            </>
          )}

          <Text style={styles.sectionHeader}>Tickets</Text>
          {event.tickets.map((tier, i) => (
            <View key={i} style={styles.tierRow}>
              <Text style={styles.tierName}>{tier.tier}</Text>
              <Text style={styles.tierPrice}>R{tier.price}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Sticky CTA at the bottom, per the design spec — always visible
          regardless of scroll position, so "buy" is never more than
          one tap away. */}
      <TouchableOpacity
        style={styles.buyButton}
        onPress={() => router.push(`/purchase/checkout?eventId=${event.id}`)}
      >
        <Text style={styles.buyButtonText}>Buy Ticket</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  emptyText: { color: '#555555' },
  image: { width: '100%', height: 260, backgroundColor: '#eee' },
  imagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, paddingBottom: 100 }, // extra bottom padding so content isn't hidden behind the sticky button
  tag: { fontSize: 13, color: '#C1502E', fontWeight: '600', marginBottom: 6 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#000000', marginBottom: 8 },
  meta: { fontSize: 14, color: '#555555', marginBottom: 2 },
  description: { fontSize: 15, color: '#000000', marginTop: 16, lineHeight: 22 },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', color: '#000000', marginTop: 24, marginBottom: 8 },
  lineupItem: { fontSize: 15, color: '#000000', marginBottom: 4 },
  tierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tierName: { fontSize: 15, color: '#000000' },
  tierPrice: { fontSize: 15, fontWeight: '600', color: '#000000' },
  buyButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#C1502E',
    padding: 18,
    alignItems: 'center',
  },
  buyButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});