import { useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useEvents } from '../../src/hooks/useEvents';
import { colors, cardShadow } from '../../src/styles/shared';
import EventCardSkeleton from '../../src/components/EventCardSkeleton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { events, loading } = useEvents();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');

  const tags = useMemo(() => {
    const unique = new Set(events.map((e) => e.tag).filter(Boolean));
    return ['All', ...Array.from(unique)];
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesTag = selectedTag === 'All' || event.tag === selectedTag;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        query === '' ||
        event.title?.toLowerCase().includes(query) ||
        event.location?.toLowerCase().includes(query) ||
        event.tag?.toLowerCase().includes(query);
      return matchesTag && matchesSearch;
    });
  }, [events, searchQuery, selectedTag]);

  const featured = filteredEvents[0];
  const rest = filteredEvents.slice(1);

  // This entire block is now OUTSIDE the scrollable FlatList — it's a
  // fixed sibling above it, not a scroll-away header. Only the event
  // cards below it will actually move when the user scrolls.
  const StickyHeader = (
    <View style={[styles.stickyHeader, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.eyebrow}>&FRIENDS COMMUNITY</Text>
      <Text style={styles.headline}>Events</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Search events, venues..."
        placeholderTextColor="#999"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={tags}
        keyExtractor={(item) => item}
        style={styles.chipRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, selectedTag === item && styles.chipActive]}
            onPress={() => setSelectedTag(item)}
          >
            <Text style={[styles.chipText, selectedTag === item && styles.chipTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        {StickyHeader}
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <EventCardSkeleton featured />
          <View style={styles.gridRow}>
            <View style={{ flex: 1 }}><EventCardSkeleton /></View>
            <View style={{ flex: 1 }}><EventCardSkeleton /></View>
          </View>
        </View>
      </View>
    );
  }

  if (events.length === 0) {
    return (
      <View style={styles.container}>
        {StickyHeader}
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No events yet</Text>
          <Text style={styles.emptySubtitle}>Check back soon, new events are added regularly.</Text>
        </View>
      </View>
    );
  }

  if (filteredEvents.length === 0) {
    return (
      <View style={styles.container}>
        {StickyHeader}
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No matches found</Text>
          <Text style={styles.emptySubtitle}>Try a different search term or category.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {StickyHeader}
      <FlatList
        data={rest}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.list}
        ListHeaderComponent={() =>
          featured ? (
            <TouchableOpacity
              style={[styles.featuredCard, cardShadow(3)]}
              onPress={() => router.push(`/event/${featured.id}`)}
            >
              {featured.image ? (
                <Image source={{ uri: featured.image }} style={styles.featuredImage} />
              ) : (
                <View style={[styles.featuredImage, styles.placeholderBox]}>
                  <View style={styles.dashedBox} />
                </View>
              )}
              <View style={styles.featuredText}>
                <Text style={styles.eventTitle}>{featured.title}</Text>
                <Text style={styles.eventMeta}>{featured.date}</Text>
                <Text style={styles.eventLocation}>{featured.location}</Text>
                <View style={styles.divider} />
                <View style={styles.priceRow}>
                  <Text style={styles.priceText}>
                    {featured.tickets?.length
                      ? `From R${Math.min(...featured.tickets.map((t: any) => t.price))}`
                      : 'Free'}
                  </Text>
                  <Text style={styles.chevron}>›</Text>
                </View>
              </View>
            </TouchableOpacity>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.gridCard, cardShadow(2)]}
            onPress={() => router.push(`/event/${item.id}`)}
          >
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.gridImage} />
            ) : (
              <View style={[styles.gridImage, styles.placeholderBox]}>
                <View style={styles.dashedBoxSmall} />
              </View>
            )}
            <View style={styles.gridText}>
              <Text style={styles.gridTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.gridMeta}>{item.date}</Text>
              <Text style={styles.gridPrice}>
                {item.tickets?.length ? `From R${Math.min(...item.tickets.map((t: any) => t.price))}` : 'Free'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  eyebrow: {
  fontFamily: 'Inter-SemiBold', fontSize: 11, letterSpacing: 1.5,
  color: colors.textMuted, textTransform: 'uppercase', marginHorizontal: 16,
},
  stickyHeader: {
  backgroundColor: colors.background,
  paddingBottom: 8,
},
  headline: { fontFamily: 'BebasNeue', fontSize: 40, color: colors.textPrimary, marginHorizontal: 16, marginBottom: 16 },
  searchInput: {
    marginHorizontal: 16, marginBottom: 12, backgroundColor: '#ECECEC',
    borderRadius: 12, padding: 12, fontFamily: 'Inter', fontSize: 14, color: colors.textPrimary,
  },
  chipRow: { marginBottom: 4, paddingLeft: 16 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E5E5', marginRight: 8,
  },
  chipActive: { backgroundColor: colors.ctaBlack, borderColor: colors.ctaBlack },
  chipText: { fontFamily: 'Inter-SemiBold', fontSize: 13, color: colors.textPrimary },
  chipTextActive: { color: '#fff' },
  gridRow: { gap: 12, paddingHorizontal: 16 },
  featuredCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginHorizontal: 16, marginTop: 16, marginBottom: 16 },
  featuredImage: { width: '100%', height: 160 },
  placeholderBox: { backgroundColor: '#EDEDED', justifyContent: 'center', alignItems: 'center' },
  dashedBox: { width: 32, height: 32, borderWidth: 2, borderColor: '#C4C4C4', borderStyle: 'dashed', borderRadius: 6 },
  dashedBoxSmall: { width: 20, height: 20, borderWidth: 1.5, borderColor: '#C4C4C4', borderStyle: 'dashed', borderRadius: 4 },
  featuredText: { padding: 16 },
  eventTitle: { fontFamily: 'BebasNeue', fontSize: 24, color: colors.textPrimary },
  eventMeta: { fontFamily: 'Inter', fontSize: 13, color: colors.textMuted, marginTop: 4 },
  eventLocation: { fontFamily: 'Inter', fontSize: 13, color: colors.textMuted },
  divider: { height: 1, backgroundColor: '#EFEFEF', marginVertical: 10 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceText: { fontFamily: 'Inter-Bold', fontSize: 15, color: colors.textPrimary },
  chevron: { fontSize: 20, color: colors.textMuted },
  gridCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', marginBottom: 12 },
  gridImage: { width: '100%', height: 90 },
  gridText: { padding: 10 },
  gridTitle: { fontFamily: 'BebasNeue', fontSize: 15, color: colors.textPrimary },
  gridMeta: { fontFamily: 'Inter', fontSize: 11, color: colors.textMuted, marginTop: 2 },
  gridPrice: { fontFamily: 'Inter-Bold', fontSize: 12, color: colors.textPrimary, marginTop: 4 },
  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontFamily: 'BebasNeue', fontSize: 22, color: colors.textPrimary, marginBottom: 8 },
  emptySubtitle: { fontFamily: 'Inter', fontSize: 14, color: colors.textMuted, textAlign: 'center' },
});