import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getEventById } from '../../src/services/eventService';
import { createTicket } from '../../src/services/ticketService';
import { useAuth } from '../../src/context/AuthContext';
import { Event, TicketTier } from '../../src/types';
import { getUserProfile } from '../../src/services/userService';

export default function CheckoutScreen() {
  // Reads the eventId query param set by the "Buy Ticket" navigation
  // in event/[id].tsx — e.g. /purchase/checkout?eventId=areece-123
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Tracks which tier the user has tapped, and how many tickets.
  // Starts with nothing selected — user must actively choose a tier.
  const [selectedTier, setSelectedTier] = useState<TicketTier | null>(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!eventId) return;
    getEventById(eventId).then((data) => {
      setEvent(data);
      setLoading(false);
    });
  }, [eventId]);

  const totalPrice = selectedTier ? selectedTier.price * quantity : 0;

 const handleContinue = async () => {
  if (!selectedTier || !user || !event) return;

  setSubmitting(true);
  try {
    // Fetch the user's name from Firestore — AuthContext only gives us
    // uid/email from Firebase Auth, not the extra profile fields we
    // store separately in users/{uid}.
    const profile = await getUserProfile(user.uid);

    const ticketId = await createTicket({
      userId: user.uid,
      userName: profile?.name ?? 'Unknown',
      userEmail: user.email ?? '',
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
      eventTime: event.time,
      eventLocation: event.location,
      eventImage: event.image,
      tag: event.tag,
      tier: selectedTier.tier,
      price: selectedTier.price,
      quantity,
      totalPrice,
    });

    router.push(`/purchase/upload-pop?ticketId=${ticketId}`);
  } catch (error) {
    console.error('Failed to create ticket:', error);
  } finally {
    setSubmitting(false);
  }
};

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#C1502E" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.centered}>
        <Text>Event not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{event.title}</Text>
      <Text style={styles.subheader}>Select a ticket tier</Text>

      {/* Tier selection — each tier renders as a tappable card.
          Tapping one sets it as selectedTier; visual highlight shows
          which one is currently chosen. */}
      {event.tickets.map((tier, i) => {
        const isSelected = selectedTier?.tier === tier.tier;
        return (
          <TouchableOpacity
            key={i}
            style={[styles.tierCard, isSelected && styles.tierCardSelected]}
            onPress={() => setSelectedTier(tier)}
            disabled={!tier.available}
          >
            <View>
              <Text style={styles.tierName}>{tier.tier}</Text>
              {!tier.available && <Text style={styles.soldOut}>Sold out</Text>}
            </View>
            <Text style={styles.tierPrice}>R{tier.price}</Text>
          </TouchableOpacity>
        );
      })}

      {/* Quantity stepper only shows once a tier is picked —
          no point letting someone set quantity before choosing what for. */}
      {selectedTier && (
        <View style={styles.quantityRow}>
          <Text style={styles.quantityLabel}>Quantity</Text>
          <View style={styles.stepper}>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              <Text style={styles.stepperText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{quantity}</Text>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => setQuantity((q) => q + 1)}
            >
              <Text style={styles.stepperText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {selectedTier && (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>R{totalPrice}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.continueButton, !selectedTier && styles.continueButtonDisabled]}
        onPress={handleContinue}
        disabled={!selectedTier || submitting}
      >
        <Text style={styles.continueButtonText}>
          {submitting ? 'Processing...' : 'Continue to Payment'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  header: { fontSize: 22, fontWeight: 'bold', color: '#000000', marginBottom: 4 },
  subheader: { fontSize: 14, color: '#555555', marginBottom: 16 },
  tierCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    marginBottom: 12,
  },
  tierCardSelected: { borderColor: '#C1502E', borderWidth: 2, backgroundColor: '#FDF3EF' },
  tierName: { fontSize: 16, fontWeight: '600', color: '#000000' },
  soldOut: { fontSize: 12, color: '#B23A2E', marginTop: 2 },
  tierPrice: { fontSize: 16, fontWeight: '600', color: '#000000' },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  quantityLabel: { fontSize: 16, color: '#000000' },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperText: { fontSize: 18, color: '#000000' },
  stepperValue: { fontSize: 16, marginHorizontal: 16, color: '#000000' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: { fontSize: 16, color: '#000000' },
  totalValue: { fontSize: 20, fontWeight: 'bold', color: '#000000' },
  continueButton: {
    backgroundColor: '#C1502E',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32,
  },
  continueButtonDisabled: { backgroundColor: '#e0b3a3' },
  continueButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});