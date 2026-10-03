import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T, H2, Sheet, Field, PrimaryButton, KV } from '../../src/components/night';
import { lookupPromo } from '../../src/services/communityService';
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
  const [found, setFound] = useState<{ code: string; percentOff: number } | null>(current.eventId === eventId && current.code ? { code: current.code, percentOff: current.percentOff } : null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  const check = async () => {
    setChecking(true);
    setError('');
    setFound(null);
    try {
      const promo = await lookupPromo(code, eventId);
      if (promo) setFound(promo);
      else setError("That code isn't valid for this event.");
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
              promoStore.set({ eventId, code: found.code, percentOff: found.percentOff });
              safeBack(router);
            }}
          />
        ) : (
          <PrimaryButton label="Check code" onPress={check} disabled={!code.trim()} loading={checking} />
        )
      }
    >
      <H2 size={36}>Promo or access code</H2>
      <T size={14} lh={1.5} color={night.body}>Got a code from a host, a partner or the &amp;FRIENDS crew? Pop it in. Access codes can unlock hidden tickets too.</T>
      <Field
        value={code}
        onChangeText={(t) => {
          setCode(t.toUpperCase());
          setFound(null);
        }}
        placeholder="E.G. BRAAMFAM"
        mono
        autoCapitalize="characters"
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
            <T size={15} weight="700" color={night.lime}>{found.percentOff}% off face value</T>
            <T mono weight="700" size={13} color={night.paper}>{found.code}</T>
          </View>
          <KV dark k="Was" v={rand(was)} />
          <KV dark k="You save" v={`−${rand(was - now)}`} />
          <KV dark k="New total" v={rand(now)} strong />
        </View>
      )}
      <T size={12} color={night.muted}>One code per booking. Codes can't be swapped for cash.</T>
    </Sheet>
  );
}
