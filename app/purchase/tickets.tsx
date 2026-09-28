import { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T, H2, Sheet, Stepper, Pill, PrimaryButton } from '../../src/components/night';
import { useEvent } from '../../src/hooks/useEvents';
import { allIn, rand } from '../../src/lib/pricing';
import { quote, selectionParams } from '../../src/lib/booking';
import { shortDate } from '../../src/lib/dates';
import { MAX_TICKETS_PER_PERSON } from '../../src/config/pricing';
import { night } from '../../src/theme/night';

// Bottom sheet: pick a tier and quantity (fees + VAT already included).
export default function TicketSheet() {
  const params = useLocalSearchParams<{ eventId: string; tier?: string; qty?: string }>();
  const router = useRouter();
  const { event } = useEvent(params.eventId);
  const [sel, setSel] = useState<{ tier: string; qty: number } | null>(params.tier ? { tier: params.tier, qty: Number(params.qty ?? 1) } : null);

  const tier = event?.tickets?.find((t) => t.tier === sel?.tier);
  const q = quote(tier, sel?.qty ?? 0);

  return (
    <Sheet
      footer={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ minWidth: 96 }}>
            <T size={13} color={night.muted}>{sel?.qty ? `${sel.qty} × ${sel.tier}` : 'Nothing yet'}</T>
            <T display size={28}>{sel?.qty ? rand(q.total) : '—'}</T>
          </View>
          <PrimaryButton label="Continue" disabled={!sel?.qty} style={{ flex: 1 }} onPress={() => sel && router.replace(`/purchase/checkout?${selectionParams(params.eventId, sel)}`)} />
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
      {event?.tickets?.map((t) => {
        const qty = sel?.tier === t.tier ? sel.qty : 0;
        return (
          <View key={t.tier} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, backgroundColor: night.card, borderWidth: qty ? 2 : 1.5, borderColor: qty ? night.ink : night.line, opacity: t.available ? 1 : 0.55 }}>
            <View style={{ flex: 1, gap: 2 }}>
              <T size={16} weight="600" style={!t.available ? { textDecorationLine: 'line-through' } : undefined}>{t.tier}</T>
              {!!t.description && <T size={13} color={night.muted}>{t.description}</T>}
              {t.available && <T mono weight="700" size={14} style={{ marginTop: 4 }}>{t.price === 0 ? 'Free' : rand(allIn(t.price))}</T>}
            </View>
            {t.available ? <Stepper value={qty} max={MAX_TICKETS_PER_PERSON} onChange={(n) => setSel(n ? { tier: t.tier, qty: n } : null)} /> : <Pill label="Sold out" />}
          </View>
        );
      })}
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <Ionicons name="information-circle-outline" size={18} color={night.muted} />
        <T size={13} color={night.muted} style={{ flex: 1 }}>Max {MAX_TICKETS_PER_PERSON} per person. You can send extras to friends later.</T>
      </View>
    </Sheet>
  );
}
