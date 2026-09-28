import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { T, H1, Amp, Screen, TopBar, Pill, PrimaryButton, TextLink } from '../../src/components/night';
import { useEvent } from '../../src/hooks/useEvents';
import { useWaitlist } from '../../src/hooks/useWaitlist';
import { useNow } from '../../src/hooks/useProfile';
import { useAuth } from '../../src/context/AuthContext';
import { leaveWaitlist } from '../../src/services/communityService';
import { allIn, rand } from '../../src/lib/pricing';
import { selectionParams } from '../../src/lib/booking';
import { shortDate } from '../../src/lib/dates';
import { subBrandFor } from '../../src/lib/subbrands';
import { night } from '../../src/theme/night';

const WINDOW_MS = 30 * 60 * 1000;

// "A spot opened up": 30 minutes to reserve a released ticket.
export default function WaitlistOfferScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { event } = useEvent(eventId);
  const { entry } = useWaitlist(eventId);
  const now = useNow();
  const brand = subBrandFor(event?.tag);

  const ends = entry?.offerExpiresAt ? new Date(entry.offerExpiresAt).getTime() : now;
  const left = Math.max(0, ends - now);
  const mm = String(Math.floor(left / 60000)).padStart(2, '0');
  const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, '0');
  const tier = event?.tickets?.[0];
  const qty = entry?.quantity ?? 1;

  return (
    <Screen header={<TopBar dark />}
      bg={night.ink}
      dark
      footerDark
      footer={
        <>
          <PrimaryButton tone="lime" label="Reserve my ticket" disabled={!left || !tier} onPress={() => tier && router.replace(`/purchase/checkout?${selectionParams(eventId, { tier: tier.tier, qty })}`)} />
          <TextLink
            label="Pass it to the next person"
            color={night.inkMuted}
            onPress={async () => {
              if (user) await leaveWaitlist(eventId, user.uid);
              router.back();
            }}
          />
        </>
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: night.lime }} />
        <T mono weight="700" size={11} color={night.lime}>YOUR TURN</T>
      </View>
      <H1 size={64} color={night.paper}>A spot{'\n'}opened up</H1>
      <T size={15} lh={1.5} color={night.inkMuted}>A ticket for {event?.title} is yours if you want it. Reserve it before the timer ends.</T>
      <View style={{ padding: 18, borderRadius: 22, backgroundColor: night.lime, gap: 10 }}>
        <T mono weight="700" size={11}>RESERVE WITHIN</T>
        <T display size={72} accessibilityLabel={`${mm} minutes ${ss} seconds left`}>{left ? `${mm}:${ss}` : 'Expired'}</T>
        <View style={{ height: 8, borderRadius: 99, backgroundColor: 'rgba(21,19,15,0.15)', overflow: 'hidden' }}>
          <View style={{ width: `${(left / WINDOW_MS) * 100}%`, height: 8, backgroundColor: night.ink }} />
        </View>
        <T size={13}>After that it goes to the next person in line</T>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, backgroundColor: night.ink2 }}>
        <View style={{ width: 52, height: 52, borderRadius: 12, backgroundColor: brand.color, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
          <Amp size={60} color={brand.deep} style={{ right: -4, top: -6 }} />
        </View>
        <View style={{ flex: 1 }}>
          <T size={15} weight="600" color={night.paper}>{event?.title}</T>
          <T size={13} color={night.inkMuted}>{shortDate(event?.date, event?.time)} · {qty} × {tier?.tier}</T>
        </View>
        <Pill label={tier ? rand(allIn(tier.price) * qty) : ''} bg={night.paper} mono />
      </View>
    </Screen>
  );
}
