import { ActivityIndicator, Pressable, Share, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { T, Screen, TopBar, IconButton, Amp, QR, Pill, PrimaryButton, IconName } from '../../src/components/night';
import StatusBadge from '../../src/components/statusBadge';
import { useTicket } from '../../src/hooks/useTicket';
import { effectiveStatus } from '../../src/services/ticketService';
import { bookingHref } from '../../src/lib/booking';
import { shortDate, stamp } from '../../src/lib/dates';
import { subBrandFor } from '../../src/lib/subbrands';
import { night } from '../../src/theme/night';

function Action({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ flex: 1, height: 64, borderRadius: 18, backgroundColor: night.ink2, alignItems: 'center', justifyContent: 'center', gap: 4, opacity: pressed ? 0.7 : 1 })}>
      <Ionicons name={icon} size={20} color={night.orange} />
      <T size={13} weight="600" color={night.paper}>{label}</T>
    </Pressable>
  );
}

function Meta({ k, v }: { k: string; v?: string }) {
  return (
    <View style={{ flex: 1 }}>
      <T mono weight="700" size={10}>{k}</T>
      <T size={15} weight="600" numberOfLines={1}>{v || '—'}</T>
    </View>
  );
}

// Ticket pass with the QR. The QR only exists once payment is confirmed.
export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { ticket, loading } = useTicket(id);

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', backgroundColor: night.ink }}><ActivityIndicator color={night.paper} /></View>;
  if (!ticket) {
    return (
      <Screen header={<TopBar dark />} bg={night.ink} dark>
        <T size={16} color={night.paper}>Ticket not found.</T>
      </Screen>
    );
  }

  const status = effectiveStatus(ticket);
  const confirmed = status === 'confirmed';
  const brand = subBrandFor(ticket.tag);
  const transferPending = ticket.transfer?.status === 'pending';

  return (
    <Screen header={<TopBar
        dark
        center={confirmed ? <Pill label="SHOW THIS AT THE DOOR" bg={night.ink2} color={night.paper} mono /> : undefined}
        right={<IconButton icon="share-outline" label="Share" tone="dark" onPress={() => Share.share({ message: `I'm going to ${ticket.eventTitle} · ${shortDate(ticket.eventDate, ticket.eventTime)} · ${ticket.eventLocation}` })} />}
      />} bg={night.ink} dark>

      <View style={{ borderRadius: 26, overflow: 'hidden', backgroundColor: night.paper }}>
        <View style={{ backgroundColor: brand.color, padding: 18, gap: 16, overflow: 'hidden' }}>
          <Amp size={240} color={brand.deep} style={{ right: -20, top: -30 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <T mono weight="700" size={11}>{`${ticket.quantity} × ${ticket.tier}`.toUpperCase()}</T>
            <StatusBadge status={status} />
          </View>
          <T display size={52} lh={0.86}>{ticket.eventTitle}</T>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Meta k="HOLDER" v={ticket.userName} />
            <Meta k="DATE" v={shortDate(ticket.eventDate, ticket.eventTime)} />
            <Meta k="DOORS" v={ticket.eventTime} />
          </View>
        </View>

        {/* perforation */}
        <View style={{ height: 22, justifyContent: 'center' }}>
          <View style={{ position: 'absolute', left: -11, width: 22, height: 22, borderRadius: 99, backgroundColor: night.ink }} />
          <View style={{ marginHorizontal: 18, borderTopWidth: 2, borderStyle: 'dashed', borderColor: night.handle }} />
          <View style={{ position: 'absolute', right: -11, width: 22, height: 22, borderRadius: 99, backgroundColor: night.ink }} />
        </View>

        <View style={{ alignItems: 'center', padding: 20, paddingTop: 8, gap: 12 }}>
          {confirmed ? (
            <>
              <QR value={ticket.id} size={200} />
              <Pressable accessibilityLabel="Copy ticket ID" onPress={() => Clipboard.setStringAsync(ticket.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <T mono weight="700" size={15}>{ticket.id}</T>
                <Ionicons name="copy-outline" size={14} color={night.muted} />
              </Pressable>
              <T size={13} color={night.muted}>{ticket.quantity > 1 ? `Admits ${ticket.quantity}. Arrive together, or send a ticket on.` : 'Admits 1'}</T>
              {ticket.checkedIn && <Pill label={`CHECKED IN ${stamp(ticket.checkedInAt).toUpperCase()}`} bg={night.successBg} color={night.success} mono />}
            </>
          ) : (
            <View style={{ alignItems: 'center', gap: 12, paddingVertical: 20 }}>
              <Ionicons name="lock-closed-outline" size={40} color={night.muted} />
              <T size={15} center color={night.body} style={{ maxWidth: 260 }}>
                {status === 'rejected' ? 'Your proof needs a fix before your QR unlocks.' : status === 'expired' ? 'This hold ran out before payment arrived.' : 'Your QR unlocks here once we have checked your payment.'}
              </T>
              <PrimaryButton label={status === 'pending_payment' ? 'Pay by EFT' : status === 'rejected' ? 'Fix my proof' : 'See status'} onPress={() => router.push(bookingHref(ticket) as any)} style={{ alignSelf: 'stretch' }} />
            </View>
          )}
        </View>
      </View>

      {confirmed && (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Action icon="paper-plane-outline" label={transferPending ? 'Pending' : 'Send'} onPress={() => router.push(transferPending ? `/ticket/transfer?ticketId=${ticket.id}` : `/ticket/send?ticketId=${ticket.id}`)} />
          <Action icon="navigate-outline" label="Directions" onPress={() => router.push(`/directions/${ticket.eventId}`)} />
          <Action icon="close-circle-outline" label="Can't go" onPress={() => router.push(`/ticket/cant-go?ticketId=${ticket.id}`)} />
        </View>
      )}
    </Screen>
  );
}
