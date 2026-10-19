import { Pressable, Share, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T, H1, H2, Amp, Screen, Hero, TopBar, IconButton, EventListRow, Card } from '../../src/components/night';
import { useEvents } from '../../src/hooks/useEvents';
import { prefsStore } from '../../src/store';
import { openMap } from '../../src/lib/booking';
import { night } from '../../src/theme/night';

// Venue profile, built from the events held there.
export default function VenueScreen() {
  const { name: raw } = useLocalSearchParams<{ name: string }>();
  const name = decodeURIComponent(raw ?? '');
  const router = useRouter();
  const { upcoming, past } = useEvents();
  const prefs = prefsStore.useStore();
  const following = prefs.followedVenues.includes(name);

  const here = upcoming.filter((e) => e.location === name);
  const before = past.filter((e) => e.location === name);
  const address = [...here, ...before].find((e) => e.address)?.address;

  return (
    <Screen header={<TopBar dark right={<IconButton icon="share-outline" label="Share" tone="dark" onPress={() => Share.share({ message: `${name}: ${here.length} upcoming on &FRIENDS` })} />} />} headerBg={night.ink}
      padTop={false}
      hero={
        <Hero bg={night.ink} gap={14}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 30 }}>
            <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: night.orange, alignItems: 'center', justifyContent: 'center' }}>
              <T display size={38}>&amp;</T>
            </View>
            <T mono weight="700" size={11} color={night.inkMuted}>VENUE · BRAAMFONTEIN</T>
          </View>
          <H1 size={60} color={night.paper}>{name}</H1>
          <Pressable
            accessibilityRole="button"
            onPress={() => prefsStore.set({ followedVenues: following ? prefs.followedVenues.filter((v) => v !== name) : [...prefs.followedVenues, name] })}
            style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingHorizontal: 16, borderRadius: 999, backgroundColor: following ? night.ink2 : night.orange }}
          >
            <Ionicons name={following ? 'checkmark' : 'add'} size={18} color={following ? night.lime : night.ink} />
            <T size={14} weight="600" color={following ? night.paper : night.ink}>{following ? 'Following' : 'Follow'}</T>
          </Pressable>
        </Hero>
      }
    >
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Card style={{ flex: 1, gap: 2 }} pad={14}>
          <T display size={32}>{here.length}</T>
          <T size={12} color={night.muted}>Upcoming</T>
        </Card>
        <Card style={{ flex: 1, gap: 2 }} pad={14}>
          <T display size={32}>{before.length}</T>
          <T size={12} color={night.muted}>Past events</T>
        </Card>
      </View>
      <Pressable accessibilityRole="button" onPress={() => openMap(address ?? `${name}, Braamfontein, Johannesburg`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, backgroundColor: night.card, borderWidth: 1.5, borderColor: night.line }}>
        <View style={{ width: 64, height: 64, borderRadius: 14, backgroundColor: night.sand, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="location" size={26} color={night.orange} />
        </View>
        <View style={{ flex: 1 }}>
          <T size={15} weight="600">{address ?? name}</T>
          <T size={13} color={night.muted}>Braamfontein · Open map</T>
        </View>
        <Ionicons name="open-outline" size={18} color={night.muted} />
      </Pressable>
      {here.length > 0 && (
        <>
          <H2>Coming up here</H2>
          {here.map((e) => (
            <EventListRow key={e.id} event={e} />
          ))}
        </>
      )}
      {before.length > 0 && (
        <>
          <H2>Before</H2>
          {before.slice(0, 5).map((e) => (
            <EventListRow key={e.id} event={e} sub="Past event" />
          ))}
        </>
      )}
    </Screen>
  );
}
