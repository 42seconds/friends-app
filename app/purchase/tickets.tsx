import { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T, H2, Sheet, PrimaryButton, TierRow } from '../../src/components/night';
import { useEvent } from '../../src/hooks/useEvents';
import { rand } from '../../src/lib/pricing';
import { Cart, cartCount, cartFromParams, cartLines, cartParams, linesSummary, cartShort, maxFor, quoteLines, setCartQty } from '../../src/lib/booking';
import { shortDate } from '../../src/lib/dates';
import { MAX_TICKETS_PER_PERSON } from '../../src/config/pricing';
import { night } from '../../src/theme/night';

// Bottom sheet: pick ticket types and how many of each (fees + VAT
// already included). Several types can go in one booking.
export default function TicketSheet() {
  const params = useLocalSearchParams<{ eventId: string; items?: string; tier?: string; qty?: string }>();
  const router = useRouter();
  const { event } = useEvent(params.eventId);
  const [cart, setCart] = useState<Cart>(() => cartFromParams(params));

  const lines = cartLines(event, cart);
  const count = cartCount(cart);
  const q = quoteLines(lines);

  return (
    <Sheet
      footer={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ minWidth: 96, maxWidth: 150 }}>
            <T size={13} color={night.muted} numberOfLines={2}>{count ? cartShort(lines) : 'Nothing yet'}</T>
            <T display size={28}>{count ? rand(q.total) : '—'}</T>
          </View>
          <PrimaryButton label="Continue" disabled={!lines.length} style={{ flex: 1 }} onPress={() => router.replace(`/purchase/checkout?${cartParams(params.eventId, cart)}`)} />
        </View>
      }
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View style={{ gap: 2, flex: 1 }}>
          <T mono size={12} color={night.muted}>{[shortDate(event?.date, event?.time), event?.location].filter(Boolean).join(' · ').toUpperCase()}</T>
          <H2 size={40}>Pick tickets</H2>
        </View>
        <T size={12} color={night.muted} style={{ textAlign: 'right' }}>Fees + VAT{'\n'}included</T>
      </View>
      {event?.tickets?.map((t) => (
        <TierRow
          key={t.tier}
          tier={t}
          qty={cart[t.tier] ?? 0}
          max={maxFor(cart, t.tier, MAX_TICKETS_PER_PERSON, t.remaining)}
          onChange={(n) => setCart((c) => setCartQty(c, t.tier, n))}
          onWaitlist={() => router.replace(`/waitlist/join?eventId=${params.eventId}&tier=${encodeURIComponent(t.tier)}`)}
        />
      ))}
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <Ionicons name="information-circle-outline" size={18} color={night.muted} />
        <T size={13} color={night.muted} style={{ flex: 1 }}>
          Mix ticket types if you like, up to {MAX_TICKETS_PER_PERSON} tickets per person ({count}/{MAX_TICKETS_PER_PERSON} picked). You can send extras to friends later.
        </T>
      </View>
    </Sheet>
  );
}
