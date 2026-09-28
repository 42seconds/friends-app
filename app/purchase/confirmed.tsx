import { ActivityIndicator, Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { T, H1, Amp, IconButton, PrimaryButton, OutlineButton, QR } from '../../src/components/night';
import { useTicket } from '../../src/hooks/useTicket';
import { addToCalendar } from '../../src/lib/booking';
import { shortDate } from '../../src/lib/dates';
import { night } from '../../src/theme/night';

const CONFETTI = [
  { left: 40, top: 120, w: 14, h: 14, c: night.lime, r: '20deg' },
  { right: 60, top: 90, w: 12, h: 12, c: night.blue, r: '0deg', round: true },
  { right: 110, top: 200, w: 16, h: 8, c: night.yellow, r: '-30deg' },
  { left: 150, top: 70, w: 10, h: 10, c: night.paper, r: '45deg' },
  { right: 36, top: 250, w: 14, h: 14, c: night.ink, r: '15deg' },
];

// Celebration once payment is approved.
export default function ConfirmedScreen() {
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { ticket } = useTicket(ticketId);

  if (!ticket) return <View style={{ flex: 1, justifyContent: 'center', backgroundColor: night.orange }}><ActivityIndicator color={night.ink} /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: night.orange, overflow: 'hidden', paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: insets.bottom + 20, gap: 18 }}>
      <StatusBar style="dark" />
      <Amp size={520} color={night.orangeDeep} style={{ left: -60, top: 20 }} />
      {CONFETTI.map((c, i) => (
        <View key={i} style={{ position: 'absolute', left: c.left, right: c.right, top: c.top, width: c.w, height: c.h, backgroundColor: c.c, borderRadius: c.round ? 99 : 3, transform: [{ rotate: c.r }] }} />
      ))}
      <View style={{ alignItems: 'flex-end' }}>
        <IconButton icon="close" label="Close" tone="onColor" onPress={() => router.replace('/(tabs)/home')} />
      </View>
      <View style={{ marginTop: 30 }}>
        <H1 size={120}>You're{'\n'}in!</H1>
      </View>
      <T size={17} lh={1.5} style={{ maxWidth: 300 }}>
        Payment approved. Your {ticket.quantity > 1 ? `${ticket.quantity} tickets` : 'ticket'} for {ticket.eventTitle} {ticket.quantity > 1 ? 'are' : 'is'} ready.
      </T>
      <Pressable accessibilityRole="button" onPress={() => router.replace(`/ticket/${ticket.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 20, backgroundColor: night.ink, transform: [{ rotate: '-1.5deg' }], shadowColor: night.ink, shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 14 }, elevation: 10 }}>
        <View style={{ borderRadius: 12, overflow: 'hidden' }}>
          <QR value={ticket.id} size={44} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <T display size={26} lh={1} color={night.paper}>{ticket.eventTitle}</T>
          <T size={13} color={night.inkMuted}>{shortDate(ticket.eventDate, ticket.eventTime)} · {ticket.quantity} × {ticket.tier}</T>
        </View>
        <Ionicons name="arrow-forward" size={20} color={night.orange} />
      </Pressable>
      <View style={{ marginTop: 'auto', gap: 10 }}>
        <PrimaryButton label="View my ticket" onPress={() => router.replace(`/ticket/${ticket.id}`)} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <OutlineButton
            label="Add to calendar"
            style={{ flex: 1 }}
            onPress={() => addToCalendar({ title: ticket.eventTitle ?? '', date: ticket.eventDate ?? '', time: ticket.eventTime ?? '', location: ticket.eventLocation ?? '', description: '' })}
          />
          {ticket.quantity > 1 && <OutlineButton label="Send a ticket" style={{ flex: 1 }} onPress={() => router.push(`/ticket/send?ticketId=${ticket.id}`)} />}
        </View>
      </View>
    </View>
  );
}
