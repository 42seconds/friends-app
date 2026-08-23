import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { listenToTicket } from '../../src/services/ticketService';
import { PurchasedTicket } from '../../src/types';

export default function BookingAwaitingScreen() {
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
  const router = useRouter();

  const [ticket, setTicket] = useState<PurchasedTicket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ticketId) return;

    // Live listener — this is the key piece. The moment the admin
    // approves/rejects on the website, Firestore pushes the update
    // here automatically, and this screen re-renders with the new status.
    const unsubscribe = listenToTicket(ticketId, (data) => {
      setTicket(data);
      setLoading(false);
    });

    // Stop listening when the user navigates away from this screen.
    return () => unsubscribe();
  }, [ticketId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#C1502E" />
      </View>
    );
  }

  if (!ticket) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Booking not found.</Text>
      </View>
    );
  }

  // Three distinct visual states depending on live status —
  // this screen's whole purpose is to reflect that status accurately.
  const isConfirmed = ticket.status === 'confirmed';
  const isRejected = ticket.status === 'rejected';

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Text style={styles.iconText}>
          {isConfirmed ? '✓' : isRejected ? '✕' : '⏳'}
        </Text>
      </View>

      <Text style={styles.title}>
        {isConfirmed
          ? 'Booking Confirmed!'
          : isRejected
          ? 'Payment Not Verified'
          : 'Awaiting Verification'}
      </Text>

      <Text style={styles.subtitle}>
        {isConfirmed
          ? 'Your ticket is ready. You can view your QR code in My Tickets.'
          : isRejected
          ? 'There was an issue verifying your payment. Please contact support.'
          : 'We\'ve received your proof of payment. This usually takes a short while to verify.'}
      </Text>

      <View style={styles.detailsBox}>
        <Text style={styles.detailLabel}>Booking Reference</Text>
        <Text style={styles.detailValue}>{ticket.id}</Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace('/(tabs)/tickets')}
      >
        <Text style={styles.buttonText}>
          {isConfirmed ? 'View My Ticket' : 'Back to Home'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', padding: 24, justifyContent: 'center' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  emptyText: { color: '#555555' },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F4EBE1',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  iconText: { fontSize: 32, color: '#C1502E' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#000000', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 15, color: '#555555', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  detailsBox: {
    backgroundColor: '#F4EBE1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  detailLabel: { fontSize: 12, color: '#3B2A22', marginBottom: 4 },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#000000' },
  button: {
    backgroundColor: '#C1502E',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});