import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { T, H1, Screen, TopBar, StepProgress, CopyRow, SectionLabel, OutlineButton, PrimaryButton, TextLink, Card, CoachMark, FirstTicketTracker, HideGuideLink } from '../../src/components/night';
import { useFirstTicketGuide } from '../../src/hooks/useFirstTicketGuide';
import { useTicket } from '../../src/hooks/useTicket';
import { useNow } from '../../src/hooks/useProfile';
import { effectiveStatus, holdEndsAt } from '../../src/services/ticketService';
import { bankDetails } from '../../src/config/payment';
import { countdown } from '../../src/lib/dates';
import { rand } from '../../src/lib/pricing';
import { night } from '../../src/theme/night';

// Step 3 of 4: tap-to-copy bank details, hold timer, then upload proof.
export default function PayScreen() {
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
  const router = useRouter();
  const { ticket, loading } = useTicket(ticketId);
  const now = useNow();
  const guide = useFirstTicketGuide();

  const status = ticket ? effectiveStatus(ticket) : null;
  useEffect(() => {
    if (status === 'expired') router.replace(`/purchase/expired?ticketId=${ticketId}`);
    if (status === 'pending_verification') router.replace(`/purchase/awaiting?ticketId=${ticketId}`);
    if (status === 'confirmed') router.replace(`/ticket/${ticketId}`);
  }, [status]);

  if (loading || !ticket) return <View style={{ flex: 1, justifyContent: 'center', backgroundColor: night.paper }}><ActivityIndicator color={night.ink} /></View>;

  const upload = (source: 'camera' | 'photos') => router.push(`/purchase/upload-pop?ticketId=${ticketId}&source=${source}`);

  return (
    <Screen header={<><TopBar onBack={() => router.replace('/(tabs)/tickets')} right={guide ? <HideGuideLink /> : undefined} />{guide ? <FirstTicketTracker step={3} /> : <StepProgress step={3} />}</>}
      footer={
        <>
          {guide ? (
            <PrimaryButton label="Next: pay in my banking app" onPress={() => router.push(`/purchase/bank-help?ticketId=${ticketId}`)} />
          ) : (
            <PrimaryButton label="Upload proof of payment" icon="cloud-upload-outline" onPress={() => upload('photos')} />
          )}
          <TextLink label="I'll pay later, remind me" muted onPress={() => router.push(`/purchase/pay-later?ticketId=${ticketId}`)} />
        </>
      }
    >
      <H1 size={56}>Pay by EFT</H1>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 20, backgroundColor: night.ink }}>
        <View style={{ gap: 2 }}>
          <T size={13} color={night.inkMuted}>Tickets held for you</T>
          <T display size={38} color={night.lime} accessibilityLabel={`Hold ends in ${countdown(holdEndsAt(ticket), now)}`}>{countdown(holdEndsAt(ticket), now)}</T>
        </View>
        <View style={{ alignItems: 'flex-end', flexShrink: 1 }}>
          <T size={14} weight="600" color={night.paper}>{ticket.quantity} × {ticket.tier}</T>
          <T size={13} color={night.inkMuted} numberOfLines={1}>{ticket.eventTitle}</T>
        </View>
      </View>

      <View style={{ borderRadius: 20, overflow: 'hidden', backgroundColor: night.card, borderWidth: 1.5, borderColor: night.line }}>
        <View style={{ backgroundColor: night.orange, paddingHorizontal: 16, paddingVertical: 6 }}>
          <CopyRow label="AMOUNT TO PAY" value={rand(ticket.totalPrice)} strong />
        </View>
        <View style={{ paddingHorizontal: 16, paddingVertical: 6 }}>
          <CopyRow label="Bank" value={bankDetails.bank} />
          <CopyRow label="Account name" value={bankDetails.accountName} />
          <CopyRow label="Account number" value={bankDetails.accountNumber} />
          <CopyRow label="Branch code" value={bankDetails.branchCode} />
        </View>
      </View>

      <CoachMark id="pay-reference" text="Copy this reference and use it exactly in your banking app. It's how we find your payment">
        <View style={{ paddingHorizontal: 16, paddingVertical: 6, borderRadius: 18, backgroundColor: night.cream, borderWidth: 1.5, borderColor: '#F0DFA0' }}>
          <CopyRow label="Reference · use exactly this" value={ticket.id} />
        </View>
      </CoachMark>
      <TextLink label="Where does each detail go in my banking app?" size={14} onPress={() => router.push(`/purchase/bank-help?ticketId=${ticketId}`)} />

      <SectionLabel>PROOF OF PAYMENT</SectionLabel>
      {ticket.proofOfPayment ? (
        <Card pad={14}>
          <T size={15} weight="600">Proof uploaded</T>
          <T size={13} color={night.muted}>You can replace it until we've checked it.</T>
        </Card>
      ) : null}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <OutlineButton label="Take photo" icon="camera-outline" style={{ flex: 1 }} onPress={() => upload('camera')} />
        <OutlineButton label="From photos" icon="images-outline" style={{ flex: 1 }} onPress={() => upload('photos')} />
      </View>
    </Screen>
  );
}
