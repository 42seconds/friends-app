import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { T, H1, H2, Screen, TopBar, Pill, KV, SlideToConfirm, TextLink } from '../../src/components/night';
import { useTicket } from '../../src/hooks/useTicket';
import { useProfile } from '../../src/hooks/useProfile';
import { releaseToWaitlist, requestRefund } from '../../src/services/ticketService';
import { last4 } from '../../src/services/userService';
import { rand } from '../../src/lib/pricing';
import { night } from '../../src/theme/night';

type Option = 'send' | 'release' | 'refund';

const OPTIONS: { key: Option; title: string; body: string; badge?: string }[] = [
  { key: 'send', title: 'Send to a friend', body: 'They get it straight away on WhatsApp. You sort out payment between you.', badge: 'Fastest' },
  { key: 'release', title: 'Release to the waitlist', body: 'When someone claims it, you get a refund to your bank.' },
  { key: 'refund', title: 'Ask for a refund', body: 'Only if the event is cancelled or moved. Otherwise, releasing is the way.' },
];

// "Can't make it?" — every option explained before anything happens.
export default function CantGoScreen() {
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
  const router = useRouter();
  const { ticket } = useTicket(ticketId);
  const { profile } = useProfile();
  const [choice, setChoice] = useState<Option>('release');

  if (!ticket) return <View style={{ flex: 1, justifyContent: 'center', backgroundColor: night.paper }}><ActivityIndicator color={night.ink} /></View>;
  const bank = profile?.refundBank;

  const confirm = async () => {
    if (choice === 'send') {
      router.replace(`/ticket/send?ticketId=${ticket.id}`);
      return;
    }
    if (!bank) {
      Alert.alert('Add your bank details first', 'We need somewhere to pay your refund.', [
        { text: 'Not now', style: 'cancel' },
        { text: 'Add details', onPress: () => router.push('/settings/bank') },
      ]);
      return;
    }
    if (choice === 'release') await releaseToWaitlist(ticket.id);
    else await requestRefund(ticket.id);
    Alert.alert(choice === 'release' ? 'Released to the waitlist' : 'Refund requested', choice === 'release' ? "We'll tell you when someone claims it. Until then, the ticket stays yours." : "We'll be in touch about your refund.");
    router.replace(`/ticket/${ticket.id}`);
  };

  const done = ticket.releasedToWaitlist || ticket.refundRequested;

  return (
    <Screen header={<TopBar />}>
      <H1 size={56}>Can't make it?</H1>
      <T size={15} lh={1.5} color={night.body}>No problem. Here's exactly what happens with each option, before you choose.</T>
      {done && <Pill label={ticket.releasedToWaitlist ? 'ALREADY RELEASED TO THE WAITLIST' : 'REFUND REQUESTED'} bg={night.cream} mono />}

      {OPTIONS.map((o) => {
        const on = choice === o.key;
        return (
          <Pressable key={o.key} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => setChoice(o.key)} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', padding: 14, borderRadius: 18, backgroundColor: night.card, borderWidth: on ? 2 : 1.5, borderColor: on ? night.ink : night.line }}>
            <View style={{ width: 24, height: 24, borderRadius: 99, borderWidth: on ? 7 : 2, borderColor: on ? night.ink : night.handle }} />
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <T size={16} weight="600">{o.title}</T>
                {o.badge && <Pill label={o.badge} bg={night.lime} />}
              </View>
              <T size={13} lh={1.45} color={night.muted}>{o.body}</T>
            </View>
          </Pressable>
        );
      })}

      {choice !== 'send' && (
        <View style={{ padding: 16, borderRadius: 20, backgroundColor: night.ink, gap: 10 }}>
          <H2 size={24} color={night.paper}>{choice === 'release' ? 'If your ticket is claimed' : 'If your refund is approved'}</H2>
          <KV dark k="You paid" v={rand(ticket.totalPrice)} />
          <T size={12} color={night.inkMuted}>
            Paid into <T size={12} weight="700" color={night.paper}>{bank ? `your account ····${last4(bank.accountNumber)}` : 'your refund account (add it in Settings)'}</T>. Refund fees, if any, are shown before we pay out.
            {choice === 'release' ? ' Not claimed by doors? The ticket stays yours.' : ''}
          </T>
        </View>
      )}

      <SlideToConfirm label={choice === 'send' ? 'Slide to continue' : choice === 'release' ? 'Slide to release' : 'Slide to request'} onConfirm={confirm} disabled={!!done && choice !== 'send'} />
      <TextLink label="Read the full refund policy" onPress={() => router.push('/settings/legal?tab=terms')} />
    </Screen>
  );
}
