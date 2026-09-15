import { View, StyleSheet } from 'react-native';

// Grey placeholder shown while the user's tickets are still loading
// from Firestore, matching the real QRCodeCard's proportions so
// nothing jumps around once real data arrives.
export default function TicketCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.titleBar} />
      <View style={styles.subtitleBar} />
      <View style={styles.pillBar} />
      <View style={styles.messageBox} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#eee' },
  titleBar: { height: 20, width: '50%', backgroundColor: '#E5E5E5', borderRadius: 4, marginBottom: 10 },
  subtitleBar: { height: 14, width: '65%', backgroundColor: '#EDEDED', borderRadius: 4, marginBottom: 14 },
  pillBar: { height: 24, width: 90, backgroundColor: '#E5E5E5', borderRadius: 12, marginBottom: 14 },
  messageBox: { height: 44, width: '100%', backgroundColor: '#EDEDED', borderRadius: 10 },
});