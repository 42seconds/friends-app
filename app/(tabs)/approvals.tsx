import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useUserRole } from '../../src/hooks/useUserRole';
import { useAuth } from '../../src/context/AuthContext';
import { listenToPendingTickets, approveTicket, rejectTicket } from '../../src/services/ticketService';

export default function ApprovalsScreen() {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { user } = useAuth();
  const [pending, setPending] = useState<any[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    const unsubscribe = listenToPendingTickets(setPending);
    return unsubscribe;
  }, [isAdmin]);

  if (roleLoading) return <View style={styles.centered}><ActivityIndicator size="large" color="#C1502E" /></View>;
  if (!isAdmin) return <View style={styles.centered}><Text style={styles.blocked}>Admin accounts only.</Text></View>;

  const handleApprove = async (ticketId: string) => {
    if (!user) return;
    setBusyId(ticketId);
    await approveTicket(ticketId, user.uid);
    setBusyId(null);
  };

  const handleReject = async (ticketId: string) => {
    if (!user) return;
    setBusyId(ticketId);
    await rejectTicket(ticketId, user.uid);
    setBusyId(null);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.header}>Pending Approvals ({pending.length})</Text>

      {pending.length === 0 && <Text style={styles.empty}>No payments waiting for review.</Text>}

      {pending.map((ticket) => (
        <View key={ticket.id} style={styles.card}>
          {!!ticket.proofOfPayment && (
            <Image source={{ uri: ticket.proofOfPayment }} style={styles.proofImage} resizeMode="contain" />
          )}
          <Text style={styles.name}>{ticket.userName ?? 'Unknown'}</Text>
          <Text style={styles.detail}>{ticket.eventTitle} · {ticket.tier} · Qty {ticket.quantity}</Text>
          <Text style={styles.detail}>Total: R{ticket.totalPrice}</Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.rejectButton]}
              onPress={() => handleReject(ticket.id)}
              disabled={busyId === ticket.id}
            >
              <Text style={styles.rejectText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => handleApprove(ticket.id)}
              disabled={busyId === ticket.id}
            >
              {busyId === ticket.id ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Approve</Text>}
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  blocked: { color: '#555555', fontSize: 16, textAlign: 'center' },
  header: { fontSize: 22, fontWeight: 'bold', color: '#000000', marginBottom: 16 },
  empty: { color: '#888888', textAlign: 'center', marginTop: 40 },
  card: { borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 16, marginBottom: 16 },
  proofImage: { width: '100%', height: 200, borderRadius: 8, marginBottom: 12, backgroundColor: '#f5f5f5' },
  name: { fontSize: 18, fontWeight: 'bold', color: '#000000' },
  detail: { fontSize: 14, color: '#555555', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  button: { flex: 1, backgroundColor: '#C1502E', padding: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  rejectButton: { backgroundColor: '#f5e5e3' },
  rejectText: { color: '#B23A2E', fontWeight: '600' },
});