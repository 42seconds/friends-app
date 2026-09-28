import { useEffect } from 'react';
import { ActivityIndicator, Linking, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { T, H1, Screen, Hero, TopBar, StepProgress, Timeline, ListGroup, ToggleRow, TextLink, Card, Pill } from '../../src/components/night';
import { useTicket } from '../../src/hooks/useTicket';
import { prefsStore } from '../../src/store';
import { enablePushNotifications } from '../../src/lib/notifications';
import { clock } from '../../src/lib/dates';
import { rand } from '../../src/lib/pricing';
import { whatsappLink } from '../../src/lib/booking';
import { support } from '../../src/config/payment';
import { night } from '../../src/theme/night';

// Step 4 of 4: live payment status. Moves on by itself the moment staff
// approve (-> You're in) or send the proof back (-> needs a fix).
export default function PaymentStatusScreen() {
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
  const router = useRouter();
  const { ticket, loading } = useTicket(ticketId);
  const prefs = prefsStore.useStore();

  useEffect(() => {
    if (ticket?.status === 'confirmed') router.replace(`/purchase/confirmed?ticketId=${ticketId}`);
    if (ticket?.status === 'rejected') router.replace(`/purchase/rejected?ticketId=${ticketId}`);
  }, [ticket?.status]);

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', backgroundColor: night.paper }}><ActivityIndicator color={night.ink} /></View>;
  if (!ticket) {
    return (
      <Screen>
        <TopBar />
        <H1>Booking not found</H1>
      </Screen>
    );
  }

  const proofIn = ticket.status === 'pending_verification';

  return (
    <Screen
      padTop={false}
      hero={
        <Hero bg={night.ink} gap={16}>
          <TopBar dark onBack={() => router.replace('/(tabs)/home')} />
          <StepProgress step={4} dark label={`STEP 4 OF 4 · REF ${ticket.id}`} />
          <View style={{ flexDirection: 'row' }}>
            <Pill label="IN PROGRESS" bg={night.yellow} mono />
          </View>
          <H1 size={56} color={night.paper}>We're checking{'\n'}your payment</H1>
          <T size={15} lh={1.5} color={night.inkMuted}>Your tickets are safe and held for you. We'll notify you the moment your QR is ready.</T>
        </Hero>
      }
    >
      <Card>
        <Timeline
          steps={[
            { label: 'Tickets reserved', sub: clock(ticket.createdAt), state: 'done' },
            { label: 'Proof received', sub: proofIn ? clock(ticket.proofUploadedAt) : 'Waiting for your upload', state: proofIn ? 'done' : 'current' },
            { label: 'Team is verifying', sub: 'Usually within a few hours', state: proofIn ? 'current' : 'todo' },
            { label: 'QR ticket ready', state: 'todo' },
          ]}
        />
      </Card>

      <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center', padding: 14, borderRadius: 20, backgroundColor: night.orange }}>
        <View style={{ width: 64, height: 64, borderRadius: 12, backgroundColor: night.card, padding: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 2, opacity: 0.35 }}>
          {Array.from({ length: 25 }).map((_, i) => (
            <View key={i} style={{ width: 7.6, height: 7.6, backgroundColor: i % 3 ? night.ink : 'transparent' }} />
          ))}
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <T display size={24}>{ticket.eventTitle}</T>
          <T size={13}>{ticket.quantity} × {ticket.tier} · {rand(ticket.totalPrice)}</T>
          <T size={13} weight="600">Your QR unlocks here</T>
        </View>
      </View>

      <ListGroup>
        <ToggleRow
          title="Push notification"
          subtitle="When it's approved or if we need anything"
          value={prefs.push}
          onChange={(v) => (v ? enablePushNotifications() : prefsStore.set({ push: false }))}
        />
        <ToggleRow title="WhatsApp updates" subtitle="Handy if you're low on data" value={prefs.whatsapp} onChange={(v) => prefsStore.set({ whatsapp: v })} />
      </ListGroup>

      <TextLink label="Taking too long? Chat to us" onPress={() => Linking.openURL(whatsappLink(`Hi! Checking on my payment for ${ticket.eventTitle}, ref ${ticket.id}.`, support.whatsapp))} />
    </Screen>
  );
}
