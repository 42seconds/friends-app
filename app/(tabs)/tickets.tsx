import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useBookings } from '../../src/hooks/useBookings';
import { getEventById } from '../../src/services/eventService';
import QRCodeCard from '../../src/components/QRCodeCard';
import { PurchasedTicket } from '../../src/types';

export default function TicketsScreen() {
  const { tickets, loading } = useBookings();

  // Tickets only store eventId, not the event's title — so we need to
  // separately fetch each event's details to display alongside the ticket.
  // This is a small cache: { eventId: title } so we don't refetch the
  // same event repeatedly if someone bought multiple tickets to it.
  const [eventTitles, setEventTitles] = useState<Record<string, string>>({});

  useEffect(() => {
    // For every ticket we don't already have a title cached for,
    // fetch that event and store its title.
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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#C1502E" />
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
          <QRCodeCard
            ticket={item}
            eventTitle={eventTitles[item.eventId] ?? 'Loading event...'}
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
  emptyText: { color: '#555555', textAlign: 'center', paddingHorizontal: 32 },
});