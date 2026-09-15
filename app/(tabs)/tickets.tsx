import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useBookings } from '../../src/hooks/useBookings';
import { getEventById } from '../../src/services/eventService';
import QRCodeCard from '../../src/components/QRCodeCard';
import TicketCardSkeleton from '../../src/components/TicketCardSkeleton';

export default function TicketsScreen() {
  const { tickets, loading } = useBookings();
  const router = useRouter();

  const [eventTitles, setEventTitles] = useState<Record<string, string>>({});

  useEffect(() => {
    tickets.forEach(async (ticket) => {
      if (!eventTitles[ticket.eventId]) {
        const event = await getEventById(ticket.eventId);
        if (event) {
          setEventTitles((prev) => ({ ...prev, [ticket.eventId]: event.title }));
        }
      }
    });
  }, [tickets]);

  if (loading) {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Tickets</Text>
      <View style={styles.list}>
        <TicketCardSkeleton />
        <TicketCardSkeleton />
        <TicketCardSkeleton />
      </View>
    </View>
  );
}

  if (tickets.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>You haven't booked any tickets yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Tickets</Text>
      <FlatList
        data={tickets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          // Tapping any ticket card now navigates into the full Ticket
          // Pass detail screen (app/ticket/[id].tsx) instead of only
          // ever showing the compact inline card.
          <TouchableOpacity activeOpacity={0.85} onPress={() => router.push(`/ticket/${item.id}`)}>
            <QRCodeCard
              ticket={item}
              eventTitle={eventTitles[item.eventId] ?? 'Loading event...'}
            />
          </TouchableOpacity>
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
  emptyText: { color: '#555555', textAlign: 'center', paddingHorizontal: 32 },
});