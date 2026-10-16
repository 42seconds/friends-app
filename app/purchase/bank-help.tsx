import { ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T, H1, Screen, TopBar, PrimaryButton, TextLink, CoachMark, FirstTicketTracker, HideGuideLink } from '../../src/components/night';
import { useTicket } from '../../src/hooks/useTicket';
import { useFirstTicketGuide } from '../../src/hooks/useFirstTicketGuide';
import { bankDetails } from '../../src/config/payment';
import { rand } from '../../src/lib/pricing';
import { night } from '../../src/theme/night';

function BankField({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={{ paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, backgroundColor: highlight ? night.cream : night.paper, borderWidth: highlight ? 2.5 : 0, borderColor: night.lime, gap: 2 }}>
      <T size={11} weight="700" color={night.muted}>{label}</T>
      <T mono weight="700" size={14}>{value}</T>
    </View>
  );
}

// "Here's where each detail goes": a generic banking-app payment form
// filled in with this booking, so first-timers know which box is which.
export default function BankHelpScreen() {
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
  const router = useRouter();
  const { ticket, loading } = useTicket(ticketId);
  const guide = useFirstTicketGuide();

  if (loading || !ticket) return <View style={{ flex: 1, justifyContent: 'center', backgroundColor: night.paper }}><ActivityIndicator color={night.ink} /></View>;

  return (
    <Screen
      header={<><TopBar right={guide ? <HideGuideLink /> : undefined} center={<T size={15} weight="600">In your banking app</T>} />{guide && <FirstTicketTracker step={3} />}</>}
      footer={
        <>
          <PrimaryButton label="I've paid, upload proof" onPress={() => router.push(`/purchase/upload-pop?ticketId=${ticketId}&source=photos`)} />
          <TextLink label="I'll pay later, remind me" muted onPress={() => router.push(`/purchase/pay-later?ticketId=${ticketId}`)} />
        </>
      }
    >
      <H1 size={52}>Here's where{'\n'}each detail goes</H1>
      <T size={15} lh={1.5} color={night.body}>
        Every bank looks a bit different, but the boxes are the same. Choose <T size={15} weight="700">Pay once-off</T>, so you don't have to save us as a beneficiary.
      </T>

      <CoachMark id="bank-their-ref" radius={26} text={"Your reference goes in Their reference (or Recipient reference), not My reference. This is the one people mix up"}>
        <View style={{ padding: 10, borderRadius: 26, backgroundColor: night.ink }}>
          <View style={{ padding: 12, borderRadius: 18, backgroundColor: night.card, gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <T size={15} weight="700">Pay once-off</T>
              <T size={11} color={night.muted}>Your banking app</T>
            </View>
            <BankField label="Beneficiary name" value={bankDetails.accountName} />
            <BankField label={`Bank · branch code`} value={`${bankDetails.bank} · ${bankDetails.branchCode}`} />
            <BankField label="Account number" value={bankDetails.accountNumber} />
            <BankField label="Amount" value={rand(ticket.totalPrice)} />
            <BankField label="My reference" value="&FRIENDS ticket" />
            <BankField label="Their reference / Recipient reference" value={ticket.id} highlight />
          </View>
        </View>
      </CoachMark>

      <View style={{ flexDirection: 'row', gap: 10, padding: 14, borderRadius: 18, backgroundColor: night.card, borderWidth: 1.5, borderColor: night.line }}>
        <Ionicons name="phone-portrait-outline" size={18} color={night.ink} />
        <T size={14} lh={1.45} style={{ flex: 1 }}>
          After you pay, <T size={14} weight="700">take a screenshot</T> of the confirmation screen. That's your proof of payment.
        </T>
      </View>
    </Screen>
  );
}
