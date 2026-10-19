import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T, H1, Amp, Screen, Hero, TopBar, IconButton, Chip, EventListRow, FeaturedEventCard, EmptyState, PrimaryButton } from '../../src/components/night';
import { useEvents } from '../../src/hooks/useEvents';
import { prefsStore } from '../../src/store';
import { subBrandByKey, subBrandFor, SUB_BRANDS } from '../../src/lib/subbrands';
import { night } from '../../src/theme/night';
import { Share } from 'react-native';

// Sub-brand page (&Music, &Talk, &Fun, &Food): follow + its events.
export default function SubBrandScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const router = useRouter();
  const brand = subBrandByKey(key) ?? SUB_BRANDS[0];
  const { upcoming, past } = useEvents();
  const prefs = prefsStore.useStore();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const following = prefs.followedBrands.includes(brand.key);

  const mine = (tab === 'upcoming' ? upcoming : past).filter((e) => subBrandFor(e.tag).key === brand.key);
  const [first, ...rest] = mine;

  return (
    <Screen header={<TopBar dark right={<IconButton icon="share-outline" label="Share" tone="dark" onPress={() => Share.share({ message: `${brand.name} at &FRIENDS: ${brand.blurb}` })} />} />} headerBg={brand.color}
      padTop={false}
      hero={
        <Hero bg={brand.color} gap={14}>
          <Amp size={420} color={brand.deep} style={{ right: -80, top: -20 }} />
          <View style={{ marginTop: 50 }}>
            <H1 size={96}>{brand.name}</H1>
          </View>
          <T size={16} lh={1.5} style={{ maxWidth: 300 }}>{brand.blurb}.</T>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: following }}
            onPress={() => prefsStore.set({ followedBrands: following ? prefs.followedBrands.filter((b) => b !== brand.key) : [...prefs.followedBrands, brand.key] })}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, backgroundColor: night.ink }}
          >
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: following ? night.lime : brand.color, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={following ? 'checkmark' : 'add'} size={22} color={night.ink} />
            </View>
            <View style={{ flex: 1 }}>
              <T size={15} weight="600" color={night.paper}>{following ? `Following ${brand.name}` : `Follow ${brand.name}`}</T>
              <T size={13} color={night.inkMuted}>{following ? 'Tap to stop following' : 'Get told first about new events'}</T>
            </View>
          </Pressable>
        </Hero>
      }
    >
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Chip label="Upcoming" active={tab === 'upcoming'} onPress={() => setTab('upcoming')} />
        <Chip label="Past" active={tab === 'past'} onPress={() => setTab('past')} />
      </View>
      {!first ? (
        <EmptyState icon="calendar-outline" tileBg={brand.color} title="Nothing yet" body={tab === 'upcoming' ? `No ${brand.name} events on the calendar. Follow to hear first.` : `No past ${brand.name} events.`}>
          <PrimaryButton label="Back to Explore" onPress={() => router.replace('/(tabs)/home')} />
        </EmptyState>
      ) : (
        <>
          {tab === 'upcoming' ? <FeaturedEventCard event={first} /> : <EventListRow event={first} />}
          {rest.map((e) => (
            <EventListRow key={e.id} event={e} sub={tab === 'past' ? 'Past event' : undefined} />
          ))}
        </>
      )}
    </Screen>
  );
}
