import { ActivityIndicator, Linking, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T, H1, Screen, Hero, TopBar, Card, SectionLabel, PrimaryButton, TextLink, Pill } from '../../src/components/night';
import { useTicket } from '../../src/hooks/useTicket';
import { useNow } from '../../src/hooks/useProfile';
import { holdEndsAt } from '../../src/services/ticketService';
import { countdown } from '../../src/lib/dates';
import { rand } from '../../src/lib/pricing';
import { whatsappLink } from '../../src/lib/booking';
import { support } from '../../src/config/payment';
import { night } from '../../src/theme/night';

function GoodProofRow({ label, value, ok }: { label: string; value?: string; ok: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
      <View style={{ width: 22, height: 22, borderRadius: 99, backgroundColor: ok ? night.success : night.border, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={ok ? 'checkmark' : 'alert'} size={14} color={ok ? night.paper : night.ink} />
      </View>
      <T size={14} style={{ flex: 1 }}>{label}</T>
      {!!value && <T mono weight="700" size={13}>{value}</T>}
    </View>
  );
}

// "Your proof needs a fix": the reason from staff, and a new upload.
export default function RejectedScreen() {
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
  const router = useRouter();
  const { ticket, loading } = useTicket(ticketId);
  const now = useNow();

  if (loading || !ticket) return <View style={{ flex: 1, justifyContent: 'center', backgroundColor: night.paper }}><ActivityIndicator color={night.ink} /></View>;

  const r = ticket.rejection;
  const held = r?.keepHeld !== false;
  const reason = r?.reason ?? 'Payment not verified';

  return (
    <Screen
      padTop={false}
      footer={<PrimaryButton label="Upload a new proof" onPress={() => router.push(`/purchase/upload-pop?ticketId=${ticket.id}&source=photos`)} />}
      hero={
        <Hero bg={night.danger} gap={14}>
          <TopBar onColor onBack={() => router.replace('/(tabs)/tickets')} right={<T mono weight="700" size={11} color={night.paper}>REF {ticket.id}</T>} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20 }}>
            <View style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: night.paper }} />
            <T mono weight="700" size={11} color={night.paper}>ACTION NEEDED</T>
          </View>
          <H1 size={56} color={night.paper}>Your proof{'\n'}needs a fix</H1>
          <T size={15} lh={1.5} color={night.paper}>{held ? 'No stress. Your tickets are still held, you just need to send a clearer proof.' : "We couldn't match your payment. Upload a clearer proof and we'll take another look."}</T>
        </Hero>
      }
    >
      <Card>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: night.pink, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="alert-circle-outline" size={22} color={night.danger} />
          </View>
          <View>
            <T mono weight="700" size={11} color={night.muted}>REASON</T>
            <T size={16} weight="700">{reason}</T>
          </View>
        </View>
        {!!r?.message && (
          <View style={{ gap: 4 }}>
            <T mono weight="700" size={11} color={night.muted}>NOTE FROM THE TEAM</T>
            <T size={14} lh={1.5} color={night.body}>{r.message}</T>
          </View>
        )}
      </Card>

      {held && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 20, backgroundColor: night.ink }}>
          <View>
            <T size={13} color={night.inkMuted}>Still held for you</T>
            <T display size={36} color={night.lime}>{countdown(holdEndsAt(ticket), now)}</T>
          </View>
          <Pill label="No need to pay again" bg={night.ink2} color={night.paper} />
        </View>
      )}

      <SectionLabel>WHAT A GOOD PROOF SHOWS</SectionLabel>
      <Card pad={12}>
        <GoodProofRow label="Amount" value={rand(ticket.totalPrice)} ok={!/amount/i.test(reason)} />
        <GoodProofRow label="Reference" value={ticket.id} ok={!/reference/i.test(reason)} />
        <GoodProofRow label="Date and the &FRIENDS account" ok={!/reflect|account/i.test(reason)} />
      </Card>

      <TextLink label="Think this is a mistake? Chat to us" onPress={() => Linking.openURL(whatsappLink(`Hi! My proof for ${ticket.eventTitle} (ref ${ticket.id}) was sent back: ${reason}.`, support.whatsapp))} />
    </Screen>
  );
}
