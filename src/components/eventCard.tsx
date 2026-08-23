import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Event } from '../types';

interface EventCardProps {
  event: Event;
  onPress: () => void;
}

// Purely presentational — takes an event object and a tap handler,
// renders it. No Firebase calls in here at all, per the architecture
// rule: screens/hooks fetch data, components just display it.
export default function EventCard({ event, onPress }: EventCardProps) {
  // Ticket tiers are embedded on the event doc (tickets[]), so we
  // derive a "starting from" price by finding the cheapest available tier.
  const lowestPrice = event.tickets?.length
    ? Math.min(...event.tickets.map((t) => t.price))
    : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {event.image ? (
        <Image source={{ uri: event.image }} style={styles.image} />
      ) : (
        // Fallback block when an event has no image set yet —
        // prevents a broken-image icon from showing.
        <View style={[styles.image, styles.imagePlaceholder]} />
      )}

      <View style={styles.info}>
        <Text style={styles.tag}>{event.tag}</Text>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.meta}>{event.date} · {event.location}</Text>
        {lowestPrice !== null && (
          <Text style={styles.price}>From R{lowestPrice}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#eee',
  },
  image: { width: '100%', height: 160, backgroundColor: '#eee' },
  imagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  info: { padding: 12 },
  tag: { fontSize: 12, color: '#C1502E', fontWeight: '600', marginBottom: 4 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#000000', marginBottom: 4 },
  meta: { fontSize: 13, color: '#555555', marginBottom: 4 },
  price: { fontSize: 14, fontWeight: '600', color: '#000000' },
});