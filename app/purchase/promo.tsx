import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T, H2, Sheet, Field, PrimaryButton, KV } from '../../src/components/night';
import { lookupPromo } from '../../src/services/communityService';
import { describeCode } from '../../src/lib/accessCodes';
import { promoStore } from '../../src/store';
import { breakdown, rand } from '../../src/lib/pricing';
import { night } from '../../src/theme/night';
import { safeBack } from '../../src/lib/nav';

// Sheet: promo or access code. Looks the code up and previews the saving.
export default function PromoSheet() {
  const { eventId, total } = useLocalSearchParams<{ eventId: string; total: string }>();
  const router = useRouter();
  const current = promoStore.useStore();
  const [code, setCode] = useState(current.eventId === eventId ? current.code : '');
  const [found, setFound] = useState<{ code: string; percentOff: number; comp: boolean; label?: string } | null>(current.eventId === eventId && current.code ? { code: current.code, percentOff: current.percentOff, comp: current.comp } : null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  const check = async () => {
    setChecking(true);
    setError('');
    setFound(null);
    try {
      const res = await lookupPromo(code, eventId);
      if (res.code) setFound({ code: res.code.code, percentOff: res.code.percentOff, comp: res.code.type === 'comp', label: res.code.label });
      else setError(res.error ?? "That code isn't valid.");
    } catch {
      setError("Couldn't check that code. Try again.");
    } finally {
      setChecking(false);
    }
  };

  // Rough preview: the exact numbers are recalculated on the review screen.
  const was = Number(total ?? 0);
  const faceApprox = was / breakdown(1).total;
  const now = found ? breakdown(faceApprox, found.percentOff).total : was;

  return (
    <Sheet
      footer={
        found ? (
          <PrimaryButton
            label="Use this code"
            onPress={() => {
              promoStore.set({ eventId, code: found.code, percentOff: found.percentOff, comp: found.comp });
              safeBack(router);
            }}
          />
        ) : (
          <PrimaryButton label="Check code" onPress={check} disabled={!code.trim()} loading={checking} />
        )
      }
    >
      <H2 size={36}>Promo or access code</H2>
      <T size={14} lh={1.5} color={night.body}>Got a code from a host, a partner or the &amp;FRIENDS crew? Enter it here. Some codes give a discount, and guest-list codes make your tickets free.</T>
      <Field
        value={code}
        onChangeText={(t) => {
          setCode(t.toUpperCase());
          setFound(null);
        }}
        placeholder="E.G. BRAAMFAM"
        mono
        autoCapitalize="characters"
        maxLength={30}
        onSubmitEditing={check}
        error={error}
        right={
          checking ? (
            <ActivityIndicator color={night.ink} />
          ) : found ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99, backgroundColor: night.successBg }}>
              <Ionicons name="checkmark" size={14} color={night.success} />
              <T size={12} weight="700" color={night.success}>Applied</T>
            </View>
          ) : undefined
        }
      />
      {found && (
        <View style={{ padding: 16, borderRadius: 18, backgroundColor: night.ink, gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <T size={15} weight="700" color={night.lime}>{describeCode({ type: found.comp ? 'comp' : 'percent', percentOff: found.percentOff })}</T>
            <T mono weight="700" size={13} color={night.paper}>{found.code}</T>
          </View>
          {!!found.label && <T size={13} color={night.inkMuted}>{found.label}</T>}
          <KV dark k="Was" v={rand(was)} />
          <KV dark k="You save" v={`−${rand(was - now)}`} />
          <KV dark k="New total" v={rand(now)} strong />
        </View>
      )}
      <T size={12} color={night.muted}>One code per booking. Codes can't be exchanged for cash.</T>
    </Sheet>
  );
}
