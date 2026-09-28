import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import T from './T';
import { night } from '../../theme/night';
import { PurchasedTicket } from '../../types';
import { effectiveStatus, holdEndsAt } from '../../services/ticketService';
import { countdown } from '../../lib/dates';

// The dark "Verifying your payment" strip on Explore. Surfaces the one
// booking that most needs the user's attention, if any.
export default function StatusBanner({ tickets }: { tickets: PurchasedTicket[] }) {
  const router = useRouter();
  const t =
    tickets.find((x) => x.status === 'rejected' && x.rejection?.keepHeld !== false) ??
    tickets.find((x) => effectiveStatus(x) === 'pending_payment') ??
    tickets.find((x) => x.status === 'pending_verification');
  if (!t) return null;

  const s = effectiveStatus(t);
  const copy =
    s === 'rejected'
      ? { title: 'Your proof needs a fix', sub: `${t.eventTitle ?? 'Your booking'} · tickets still held`, dot: night.danger, to: `/purchase/rejected?ticketId=${t.id}` }
      : s === 'pending_payment'
        ? { title: 'Finish paying by EFT', sub: `${t.eventTitle ?? 'Your booking'} · held for ${countdown(holdEndsAt(t)).slice(0, 5)}`, dot: night.orange, to: `/purchase/pay?ticketId=${t.id}` }
        : { title: 'Verifying your payment', sub: `${t.eventTitle ?? 'Your booking'} · proof received`, dot: night.yellow, to: `/purchase/awaiting?ticketId=${t.id}` };

  return (
    <Pressable accessibilityRole="button" onPress={() => router.push(copy.to as any)} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 18, backgroundColor: night.ink, opacity: pressed ? 0.85 : 1 })}>
      <View style={{ width: 36, height: 36, borderRadius: 99, borderWidth: 3, borderColor: night.ink2, borderTopColor: copy.dot, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: copy.dot }} />
      </View>
      <View style={{ flex: 1, gap: 1 }}>
        <T size={14} weight="600" color={night.paper}>{copy.title}</T>
        <T size={13} color={night.inkMuted} numberOfLines={1}>{copy.sub}</T>
      </View>
      <Ionicons name="chevron-forward" size={18} color={night.orange} />
    </Pressable>
  );
}
