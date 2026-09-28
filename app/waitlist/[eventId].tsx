import { ActivityIndicator, Alert, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { T, H1, H2, Amp, Screen, Hero, TopBar, Pill, Card, ListGroup, ToggleRow, PrimaryButton, TextLink } from '../../src/components/night';
import { useEvent } from '../../src/hooks/useEvents';
import { useWaitlist } from '../../src/hooks/useWaitlist';
import { useAuth } from '../../src/context/AuthContext';
import { leaveWaitlist, setWaitlistAlerts } from '../../src/services/communityService';
import { allIn, rand } from '../../src/lib/pricing';
import { shortDate } from '../../src/lib/dates';
import { subBrandFor } from '../../src/lib/subbrands';
import { night } from '../../src/theme/night';

const STEPS = [
  'Someone can\'t make it and releases their ticket at face value.',
  'It\'s offered to the next person in line. You get 30 minutes to reserve it.',
  'Pay by EFT like normal. No resale mark-ups, ever.',
];

// Sold-out event: join the waitlist, or see your place in line.
export default function WaitlistScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { event } = useEvent(eventId);
  const { entry, position, total, loading } = useWaitlist(eventId);
  const brand = subBrandFor(event?.tag);
  const price = event?.tickets?.length ? allIn(Math.min(...event.tickets.map((t) => t.price))) : 0;
  const offerLive = entry?.offerExpiresAt && new Date(entry.offerExpiresAt).getTime() > Date.now();

  const join = () => (user ? router.push(`/waitlist/join?eventId=${eventId}`) : router.push('/(auth)/login'));

  const leave = () =>
    Alert.alert('Leave the waitlist?', "You'll lose your place in line.", [
      { text: 'Stay', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: () => user && leaveWaitlist(eventId, user.uid) },
    ]);

  return (
    <Screen
      padTop={false}
      footer={
        loading ? undefined : offerLive ? (
          <PrimaryButton tone="lime" label="A spot opened up · reserve it" onPress={() => router.push(`/waitlist/offer?eventId=${eventId}`)} />
        ) : !entry ? (
          <PrimaryButton label="Join the waitlist" onPress={join} />
        ) : undefined
      }
      hero={
        <Hero bg={brand.color} gap={12}>
          <Amp size={320} color={brand.deep} style={{ right: -40, top: 0 }} />
          <TopBar dark />
          <View style={{ flexDirection: 'row', marginTop: 30 }}>
            <Pill label={`${brand.name} · ${shortDate(event?.date, event?.time)}`} bg={night.ink} color={night.paper} />
          </View>
          <H1 size={60}>{event?.title ?? ''}</H1>
          <Pill label="Sold out" bg={night.paper} />
        </Hero>
      }
    >
      {loading ? (
        <ActivityIndicator color={night.ink} />
      ) : entry ? (
        <View style={{ padding: 18, borderRadius: 22, backgroundColor: night.ink, gap: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ gap: 2 }}>
              <T size={15} weight="600" color={night.paper}>You're on the waitlist</T>
              <T size={13} color={night.inkMuted}>{entry.quantity} × ticket · {rand(price)} all-in each</T>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <T display size={56} color={brand.color}>#{position}</T>
              <T size={12} color={night.inkMuted}>in line</T>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 3 }} accessibilityLabel={`${position - 1} people ahead of you`}>
            {Array.from({ length: Math.min(Math.max(total, position), 20) }).map((_, i) => (
              <View key={i} style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: i < position - 1 ? brand.color : i === position - 1 ? night.paper : night.darkLine }} />
            ))}
          </View>
        </View>
      ) : null}

      <H2>How it works</H2>
      {STEPS.map((s, i) => (
        <Card key={i} pad={14} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: brand.color, alignItems: 'center', justifyContent: 'center' }}>
            <T display size={20}>{i + 1}</T>
          </View>
          <T size={14} lh={1.45} style={{ flex: 1 }}>{s}</T>
        </Card>
      ))}

      {entry && user && (
        <>
          <ListGroup>
            <ToggleRow title="Alert me on WhatsApp too" subtitle="So you don't miss your 30 minutes" value={entry.whatsappAlerts} onChange={(v) => setWaitlistAlerts(eventId, user.uid, v)} />
          </ListGroup>
          <TextLink label="Leave waitlist" muted onPress={leave} />
        </>
      )}
    </Screen>
  );
}
