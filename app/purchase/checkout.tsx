import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getEventById } from '../../src/services/eventService';
import { getUserProfile } from '../../src/services/userService';
import { createTicket } from '../../src/services/ticketService';
import { useAuth } from '../../src/context/AuthContext';
import { colors, cardShadow } from '../../src/styles/shared';

export default function CheckoutScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    getEventById(eventId).then((data) => {
      setEvent(data);
      if (data?.tickets?.length) setSelectedTier(data.tickets[0]);
      setLoading(false);
    });
  }, [eventId]);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#1A1A1A" /></View>;
  }

  if (!event) {
    return <View style={styles.centered}><Text style={styles.notFound}>Event not found.</Text></View>;
  }

  const total = selectedTier ? selectedTier.price * quantity : 0;

  const handleContinue = async () => {
    if (!selectedTier || !user || !event) return;
    setSubmitting(true);
    try {
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
        totalPrice: total,
      });
      router.push(`/purchase/upload-pop?ticketId=${ticketId}`);
    } catch (err) {
      console.error('Failed to create ticket:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.tag}>
        <Text style={styles.tagText}>REVIEW BOOKING</Text>
      </View>

      <Text style={styles.eventTitle}>{event.title}</Text>
      <Text style={styles.eventMeta}>
        {event.date}  •  {event.location}
      </Text>

      <View style={styles.divider} />

      <Text style={styles.sectionLabel}>SELECT A TICKET TIER</Text>

      {event.tickets?.map((tier: any) => {
        const isSelected = selectedTier?.tier === tier.tier;
        return (
          <TouchableOpacity
            key={tier.tier}
            style={[styles.tierRow, isSelected && styles.tierRowSelected]}
            onPress={() => setSelectedTier(tier)}
          >
            <Text style={[styles.tierName, isSelected && styles.tierNameSelected]}>{tier.tier}</Text>
            <Text style={[styles.tierPrice, isSelected && styles.tierNameSelected]}>R{tier.price}</Text>
          </TouchableOpacity>
        );
      })}

      <View style={[styles.quantityCard, cardShadow(2)]}>
        <Text style={styles.quantityLabel}>Quantity</Text>
        <View style={styles.stepperRow}>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            <Text style={styles.stepperText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.quantityValue}>{quantity}</Text>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={() => setQuantity((q) => q + 1)}
          >
            <Text style={styles.stepperText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.summaryCard, cardShadow(3)]}>
        <Text style={styles.summaryLabel}>ORDER SUMMARY</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryText}>Subtotal</Text>
          <Text style={styles.summaryValue}>R{total.toFixed(2)}</Text>
        </View>
        <View style={styles.totalDivider} />
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>R{total.toFixed(2)}</Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleContinue} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>CONTINUE TO PAYMENT</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.footnote}>Manual EFT — you'll upload proof of payment next.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFound: { fontFamily: 'Inter', color: colors.textMuted },
  tag: { backgroundColor: '#ECECEC', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start', marginBottom: 12 },
  tagText: { fontFamily: 'Inter-SemiBold', fontSize: 11, letterSpacing: 1, color: colors.textMuted },
  eventTitle: { fontFamily: 'BebasNeue', fontSize: 34, color: colors.textPrimary },
  eventMeta: { fontFamily: 'Inter', fontSize: 13, color: colors.textMuted, marginTop: 6 },
  divider: { height: 1, backgroundColor: '#E5E5E5', marginVertical: 20 },
  sectionLabel: { fontFamily: 'Inter-SemiBold', fontSize: 12, letterSpacing: 1, color: colors.textMuted, marginBottom: 10 },
  tierRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: '#E5E5E5',
  },
  tierRowSelected: { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
  tierName: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: colors.textPrimary },
  tierNameSelected: { color: '#fff' },
  tierPrice: { fontFamily: 'Inter-Bold', fontSize: 15, color: colors.textPrimary },
  quantityCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quantityLabel: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: colors.textPrimary },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepperButton: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#D5D5D5', justifyContent: 'center', alignItems: 'center' },
  stepperText: { fontSize: 18, color: colors.textPrimary },
  quantityValue: { fontFamily: 'Inter-Bold', fontSize: 16, color: colors.textPrimary, minWidth: 20, textAlign: 'center' },
  summaryCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginTop: 20 },
  summaryLabel: { fontFamily: 'Inter-SemiBold', fontSize: 12, letterSpacing: 1, color: colors.textMuted, marginBottom: 14 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryText: { fontFamily: 'Inter', fontSize: 14, color: colors.textMuted },
  summaryValue: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: colors.textPrimary },
  totalDivider: { height: 1, backgroundColor: '#EFEFEF', marginVertical: 10 },
  totalLabel: { fontFamily: 'Inter-Bold', fontSize: 17, color: colors.textPrimary },
  totalValue: { fontFamily: 'BebasNeue', fontSize: 24, color: colors.textPrimary },
  button: { backgroundColor: colors.ctaBlack, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 18 },
  buttonText: { fontFamily: 'Inter-Bold', fontSize: 13, letterSpacing: 1, color: '#fff' },
  footnote: { fontFamily: 'Inter', fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 10 },
});