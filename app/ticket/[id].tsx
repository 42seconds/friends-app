import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getTicketById } from '../../src/services/ticketService';
import AnimatedQRReveal from '../../src/components/AnimatedQRReveal';
import { colors } from '../../src/styles/shared';

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getTicketById(id).then((t) => {
      setTicket(t);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#1A1A1A" /></View>;
  }

  if (!ticket) {
    return <View style={styles.centered}><Text style={styles.notFound}>Ticket not found.</Text></View>;
  }

  const isConfirmed = ticket.status === 'confirmed';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={20} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>TICKET PASS</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="share-outline" size={20} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      <View style={styles.darkCard}>
        <Text style={styles.tag}>{(ticket.tag ?? 'ACCESS').toUpperCase()}</Text>
        <Text style={styles.eventTitle}>{ticket.eventTitle}</Text>
        <Text style={styles.eventSubtitle}>{ticket.tier}</Text>

        <View style={styles.divider} />

        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>HOLDER</Text>
            <Text style={styles.gridValue}>{ticket.userName}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>DATE</Text>
            <Text style={styles.gridValue}>{ticket.eventDate}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>TIME</Text>
            <Text style={styles.gridValue}>{ticket.eventTime}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>VENUE</Text>
            <Text style={styles.gridValue}>{ticket.eventLocation}</Text>
          </View>
        </View>

        <View style={styles.qrSection}>
          {isConfirmed ? (
            <AnimatedQRReveal ticketId={ticket.id} />
          ) : (
            <Text style={styles.waitingText}>QR code unlocks once payment is confirmed.</Text>
          )}
          <Text style={styles.hint}>Present code at entrance for scanning.</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 50 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFound: { fontFamily: 'Inter', color: colors.textMuted },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16 },
  headerButton: { backgroundColor: '#ECECEC', borderRadius: 20, padding: 10 },
  headerTitle: { fontFamily: 'BebasNeue', fontSize: 18, letterSpacing: 1, color: colors.textPrimary },
  darkCard: { backgroundColor: '#161616', marginHorizontal: 16, borderRadius: 20, padding: 20 },
  tag: { fontFamily: 'Inter-SemiBold', fontSize: 11, letterSpacing: 1.5, color: '#8A8A8A' },
  eventTitle: { fontFamily: 'BebasNeue', fontSize: 28, color: '#fff', marginTop: 6 },
  eventSubtitle: { fontFamily: 'Inter', fontSize: 13, color: '#B0B0B0', marginTop: 4 },
  divider: { height: 1, backgroundColor: '#333', marginVertical: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 20 },
  gridItem: { width: '45%' },
  gridLabel: { fontFamily: 'Inter-SemiBold', fontSize: 10, letterSpacing: 1, color: '#8A8A8A' },
  gridValue: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: '#fff', marginTop: 4 },
  qrSection: { alignItems: 'center', paddingTop: 8 },
  waitingText: { fontFamily: 'Inter', fontSize: 13, color: '#B0B0B0', textAlign: 'center', paddingVertical: 20 },
  hint: { fontFamily: 'Inter', fontSize: 11, color: '#8A8A8A', marginTop: 12 },
});