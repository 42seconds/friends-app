import { View, StyleSheet } from 'react-native';

// Static grey placeholder shapes shown while events are still loading
// from Firestore, so the screen never looks broken/blank during that
// gap — matches the real card's proportions so content doesn't jump
// around once real data arrives.
export default function EventCardSkeleton({ featured = false }: { featured?: boolean }) {
  return (
    <View style={[styles.card, featured && styles.featuredCard]}>
      <View style={[styles.image, featured && styles.featuredImage]} />
      <View style={styles.textBlock}>
        <View style={styles.titleBar} />
        <View style={styles.subtitleBar} />
        <View style={styles.priceBar} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  featuredCard: { marginBottom: 16 },
  image: { width: '100%', height: 100, backgroundColor: '#E5E5E5' },
  featuredImage: { height: 160 },
  textBlock: { padding: 12, gap: 8 },
  titleBar: { height: 14, width: '70%', backgroundColor: '#E5E5E5', borderRadius: 4 },
  subtitleBar: { height: 10, width: '50%', backgroundColor: '#EDEDED', borderRadius: 4 },
  priceBar: { height: 12, width: '35%', backgroundColor: '#E5E5E5', borderRadius: 4 },
});