import { ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { T, H1, Amp, Screen, TopBar, Note, Card, PrimaryButton, OutlineButton } from '../../src/components/night';
import { useTicket } from '../../src/hooks/useTicket';
import { useEvent } from '../../src/hooks/useEvents';
import { selectionParams } from '../../src/lib/booking';
import { subBrandFor } from '../../src/lib/subbrands';
import { HOLD_HOURS } from '../../src/config/pricing';
import { night } from '../../src/theme/night';

// The EFT hold lapsed before a proof arrived.
export default function HoldExpiredScreen() {
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
  const router = useRouter();
  const { ticket } = useTicket(ticketId);
  const { event } = useEvent(ticket?.eventId);

  if (!ticket) return <View style={{ flex: 1, justifyContent: 'center', backgroundColor: night.paper }}><ActivityIndicator color={night.ink} /></View>;

  const brand = subBrandFor(ticket.tag);
  const tier = event?.tickets?.find((t) => t.tier === ticket.tier);
  const stillAvailable = !!tier?.available && !event?.soldOut;

  return (
    <Screen header={<TopBar onBack={() => router.replace('/(tabs)/tickets')} />}
      footer={
        <>
          {stillAvailable && <PrimaryButton label="Reserve again" onPress={() => router.replace(`/purchase/tickets?${selectionParams(ticket.eventId, { tier: ticket.tier, qty: ticket.quantity })}`)} />}
          <OutlineButton label="I already paid, upload proof" onPress={() => router.push(`/purchase/upload-pop?ticketId=${ticket.id}&source=photos`)} />
        </>
      }
    >
      <View style={{ height: 180, borderRadius: 24, backgroundColor: brand.color, padding: 18, overflow: 'hidden', justifyContent: 'space-between', transform: [{ rotate: '-2deg' }], opacity: 0.8 }}>
        <Amp size={260} color={brand.deep} style={{ right: -20, top: -30 }} />
        <T display size={46} lh={0.86}>{ticket.eventTitle}</T>
        <View style={{ alignSelf: 'flex-start', backgroundColor: night.ink, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }}>
          <T mono weight="700" size={18} color={night.paper}>00:00:00</T>
        </View>
      </View>
      <H1 size={56}>Your hold{'\n'}ran out</H1>
      <T size={15} lh={1.5} color={night.body}>
        We held {ticket.quantity} {ticket.tier} ticket{ticket.quantity > 1 ? 's' : ''} for {HOLD_HOURS} hours, but didn't get a proof of payment, so they went back on sale.
      </T>
      <Note icon="information-circle-outline">
        <T size={14} lh={1.5} color={night.paper}>
          <T size={14} weight="700" color={night.paper}>Already paid?</T> Upload your proof anyway. We'll match it to your reference and sort it out, or refund you.
        </T>
      </Note>
      <Card pad={14}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <T size={15} weight="600">{ticket.tier} tickets</T>
          <T size={14} weight="700" color={stillAvailable ? night.success : night.danger}>{stillAvailable ? 'Still available' : 'Sold out'}</T>
        </View>
      </Card>
    </Screen>
  );
}
