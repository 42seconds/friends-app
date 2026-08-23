import { View, Text, StyleSheet } from 'react-native';
import { TicketStatus } from '../types';

interface StatusBadgeProps {
  status: TicketStatus;
}

const STATUS_CONFIG = {
  pending_payment: { label: 'Pending Payment', color: '#C98A2D', bg: '#FBF0E0' },
  pending_verification: { label: 'Awaiting Verification', color: '#C98A2D', bg: '#FBF0E0' },
  confirmed: { label: 'Confirmed', color: '#4E7C4B', bg: '#E8F0E7' },
  rejected: { label: 'Rejected', color: '#B23A2E', bg: '#F5E5E3' },
};

// Fallback used if status is ever missing or doesn't exactly match one
// of the 4 expected values — e.g. a typo made directly in Firestore
// Console while testing. Better to show something odd-looking than
// crash the whole screen.
const FALLBACK_CONFIG = { label: 'Unknown Status', color: '#888888', bg: '#eeeeee' };

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? FALLBACK_CONFIG;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 12, fontWeight: '600' },
});