import { ActivityIndicator, Linking, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { T, H1, Amp, Screen, TopBar, Avatar, Card, Timeline, Note, PrimaryButton, OutlineButton, Pill } from '../../src/components/night';
import { useTicket } from '../../src/hooks/useTicket';
import { cancelTransfer } from '../../src/services/ticketService';
import { whatsappLink } from '../../src/lib/booking';
import { claimUrl } from '../../src/config/payment';
import { shortDate, stamp } from '../../src/lib/dates';
import { night } from '../../src/theme/night';

// Waiting for a friend to accept a sent ticket.
export default function TransferPendingScreen() {
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
  const router = useRouter();
  const { ticket } = useTicket(ticketId);

  if (!ticket) return <View style={{ flex: 1, justifyContent: 'center', backgroundColor: night.paper }}><ActivityIndicator color={night.ink} /></View>;
  const tr = ticket.transfer;
  const first = tr?.toName.split(' ')[0] ?? 'your friend';

  if (!tr || tr.status !== 'pending') {
    return (
      <Screen footer={<PrimaryButton label="Back to my ticket" onPress={() => router.replace(`/ticket/${ticket.id}`)} />}>
        <TopBar />
        <H1>{tr?.status === 'accepted' ? `${first} has it` : 'Transfer cancelled'}</H1>
        <T size={15} color={night.body}>{tr?.status === 'accepted' ? 'The ticket is now in their name.' : 'The ticket is back with you. The link no longer works.'}</T>
      </Screen>
    );
  }

  const resend = () => Linking.openURL(whatsappLink(`Reminder: your ticket for ${ticket.eventTitle} is waiting. Accept it here: ${claimUrl(ticket.id)}`, tr.toPhone));

  return (
    <Screen>
      <TopBar onBack={() => router.replace(`/ticket/${ticket.id}`)} right={<Pill label="TRANSFER PENDING" bg={night.yellow} mono />} />
      <H1 size={56}>Waiting for{'\n'}{first} to accept</H1>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 20, backgroundColor: night.ink, overflow: 'hidden' }}>
        <Amp size={140} color={night.ink2} style={{ right: -10, top: -20 }} />
        <Avatar name={tr.toName} size={46} />
        <View style={{ flex: 1 }}>
          <T size={16} weight="600" color={night.paper}>{tr.toName}</T>
          <T size={13} color={night.inkMuted}>{ticket.tier} · {ticket.eventTitle}</T>
        </View>
      </View>
      <Card>
        <Timeline
          steps={[
            { label: 'Sent on WhatsApp', sub: stamp(tr.sentAt).toUpperCase(), state: 'done' },
            { label: `${first} accepts`, state: 'current' },
          ]}
        />
      </Card>
      <Note tone="cream" icon="time-outline">
        <T size={14} lh={1.5}>
          If {first} doesn't accept before doors on <T size={14} weight="700">{shortDate(ticket.eventDate, ticket.eventTime)}</T>, the ticket stays with you.
        </T>
      </Note>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <PrimaryButton label="Resend link" arrow={false} center style={{ flex: 1 }} onPress={resend} />
        <OutlineButton label="Cancel transfer" style={{ flex: 1 }} height={58} onPress={() => cancelTransfer(ticket.id)} />
      </View>
      <T size={13} color={night.muted} center>Cancelling takes the ticket back right away. {first}'s link stops working.</T>
    </Screen>
  );
}
