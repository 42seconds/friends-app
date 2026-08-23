import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { PurchasedTicket } from '../types';
import StatusBadge from './statusBadge';

interface TicketCardProps {
  ticket: PurchasedTicket;
  eventTitle: string;
}


// Renders one ticket as a card. THE HARD RULE lives here: the QR code
// only renders when status === "confirmed". Every other status shows
// a status badge instead — never a QR code, never a fake/greyed-out one.
export default function QRCodeCard({ ticket, eventTitle }: TicketCardProps) {
  const isConfirmed = ticket.status === 'confirmed';

  return (
    <View style={styles.card}>
      <Text style={styles.eventTitle}>{eventTitle}</Text>
      <Text style={styles.meta}>{ticket.tier} · Qty {ticket.quantity}</Text>

      <StatusBadge status={ticket.status} />

      {isConfirmed ? (
        // QR encodes the ticket's own Firestore document ID — this is
        // what an admin/scanner at the door would look up to verify
        // and check in this specific booking.
        <View style={styles.qrWrapper}>
          <QRCode value={ticket.id} size={160} />
        </View>
      ) : (
        <View style={styles.waitingBox}>
          <Text style={styles.waitingText}>
            {ticket.status === 'rejected'
              ? 'Payment could not be verified.'
              : 'Your QR code will appear here once payment is confirmed.'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  eventTitle: { fontSize: 18, fontWeight: 'bold', color: '#000000', marginBottom: 2 },
  meta: { fontSize: 13, color: '#555555', marginBottom: 10 },
  qrWrapper: { alignItems: 'center', marginTop: 16, paddingVertical: 12 },
  waitingBox: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F4EBE1',
    borderRadius: 8,
  },
  waitingText: { fontSize: 13, color: '#3B2A22', textAlign: 'center' },
});