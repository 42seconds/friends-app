import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T, H1, H2, Screen, IconButton, Chip, StatusBanner, FeaturedEventCard, EventListRow, EmptyState, PrimaryButton, OutlineButton, TextLink, CoachMark, FirstTicketIntro } from '../../src/components/night';
import { useFirstTicketGuide } from '../../src/hooks/useFirstTicketGuide';
import { useEvents, retryEvents } from '../../src/hooks/useEvents';
import { useBookings } from '../../src/hooks/useBookings';
import { useAuth } from '../../src/context/AuthContext';
import { SUB_BRANDS, SubBrandKey, subBrandFor } from '../../src/lib/subbrands';
import { night } from '../../src/theme/night';

export default function ExploreScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { upcoming, loading, error } = useEvents();
  const { tickets } = useBookings();
  const [brand, setBrand] = useState<SubBrandKey | 'all'>('all');
  const guide = useFirstTicketGuide();

  const list = useMemo(() => (brand === 'all' ? upcoming : upcoming.filter((e) => subBrandFor(e.tag).key === brand)), [upcoming, brand]);
  const featured = list.find((e) => e.featured) ?? list[0];
  const rest = list.filter((e) => e !== featured);

  // Offline: events couldn't load. Tickets still work from the cache.
  if (error && !upcoming.length) {
    return (
      <Screen bg={night.ink} dark tabBar fill contentStyle={{ justifyContent: 'center' }}>
        <EmptyState icon="cloud-offline-outline" tileBg={night.ink2} iconColor={night.orange} dark title="You're offline" body="We couldn't load new events. Check your connection and try again.">
          <PrimaryButton tone="lime" label="Open my tickets" onPress={() => router.push('/(tabs)/tickets')} />
          <OutlineButton dark label="Try again" onPress={retryEvents} />
        </EmptyState>
      </Screen>
    );
  }

  return (
    <Screen
      tabBar
      header={
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="location" size={16} color={night.orange} />
            <T size={14} weight="600">Braamfontein, JHB</T>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <IconButton icon="search" label="Search" onPress={() => router.push('/search')} />
            {user && <IconButton icon="notifications-outline" label="Notifications" onPress={() => router.push('/inbox')} />}
          </View>
        </View>
      }
    >

      <StatusBanner tickets={tickets} />
      {guide && <FirstTicketIntro />}

      <View style={{ marginTop: 6 }}>
        <H1 size={60}>This week{'\n'}in Braam</H1>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
        <Chip display label="All" active={brand === 'all'} onPress={() => setBrand('all')} />
        {SUB_BRANDS.map((b) => (
          <Chip key={b.key} display label={b.name} dot={brand === b.key ? undefined : b.color} active={brand === b.key} activeColor={b.color} onPress={() => setBrand(b.key)} />
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={night.ink} style={{ marginTop: 40 }} />
      ) : !featured ? (
        <EmptyState icon="calendar-outline" tileBg={night.orange} title="Quiet week" body="Nothing on the calendar just yet. Follow the sub-brands you love and we'll tell you the moment something drops.">
          <PrimaryButton label="Follow sub-brands" onPress={() => router.push(`/brand/${brand === 'all' ? 'music' : brand}`)} />
          <OutlineButton label="Look back at past events" onPress={() => router.push('/past')} />
        </EmptyState>
      ) : (
        <>
          <CoachMark id="explore-card" number={guide ? 1 : undefined} text={guide ? 'Start here. Tap any event that looks good' : 'Tap an event to see tickets'} radius={24}>
            <FeaturedEventCard event={featured} />
          </CoachMark>
          {rest.length > 0 && (
            <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 6 }}>
                <H2>Coming up</H2>
                <TextLink label="See all" onPress={() => router.push('/search')} />
              </View>
              <View style={{ gap: 10 }}>
                {rest.map((e) => (
                  <EventListRow key={e.id} event={e} />
                ))}
              </View>
            </>
          )}
          <TextLink label="Look back at past events" muted onPress={() => router.push('/past')} />
        </>
      )}
    </Screen>
  );
}
