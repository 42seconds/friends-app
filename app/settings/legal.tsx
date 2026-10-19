import { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T, H1, Screen, TopBar, Segmented, SectionLabel, ListGroup, TextLink } from '../../src/components/night';
import { HOLD_HOURS } from '../../src/config/pricing';
import { support } from '../../src/config/payment';
import { night } from '../../src/theme/night';

const PRIVACY = [
  { q: 'What we collect', a: 'Name, contact details, bookings, proof of payment, refund bank details' },
  { q: 'Why we collect it', a: 'To issue tickets, check payments, pay refunds and keep events safe' },
  { q: 'Who we share it with', a: 'Only the host of events you book, and nobody else without asking' },
];

const TERMS = [
  { q: 'Prices', a: 'Every price you see includes the service fee and VAT. What you see is what you pay.' },
  { q: 'Holds and payment', a: `Reserved tickets are held for ${HOLD_HOURS} hours while you pay by EFT. Unpaid holds are released back on sale.` },
  { q: 'Transfers', a: 'You can send a ticket to a friend at face value. It stays yours until they accept.' },
  { q: 'Refunds', a: 'Refunds apply when an event is cancelled or moved. Otherwise you can release your ticket to the waitlist.' },
  { q: 'At the door', a: 'One QR admits the people on that booking. Night events are 18+ and ID is required.' },
];

const RIGHTS = [
  ['See it', 'Ask for a copy of your data'],
  ['Fix it', 'Correct anything wrong'],
  ['Delete it', 'Close your account'],
  ['Object', 'Say no to marketing'],
];

export default function LegalScreen() {
  const { tab: initial } = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<'privacy' | 'terms'>(initial === 'terms' ? 'terms' : 'privacy');
  const [open, setOpen] = useState<number | null>(0);
  const items = tab === 'privacy' ? PRIVACY : TERMS;

  return (
    <Screen header={<TopBar />}>
      <H1 size={56}>Terms &amp;{'\n'}privacy</H1>
      <Segmented value={tab} onChange={(t) => { setTab(t); setOpen(0); }} options={[{ key: 'privacy', label: 'Privacy' }, { key: 'terms', label: 'Terms' }]} />
      <View style={{ padding: 16, borderRadius: 20, backgroundColor: night.ink, gap: 6 }}>
        <T display size={24} color={night.lime}>In short</T>
        <T size={14} lh={1.5} color={night.paper}>
          {tab === 'privacy'
            ? "We collect what we need to sell you tickets and get you in the door. We don't sell your data. You can see it, fix it or delete it anytime."
            : 'All-in prices, a fair hold while you pay by EFT, transfers at face value, and nothing irreversible on a single tap.'}
        </T>
      </View>
      <SectionLabel>THE DETAILS</SectionLabel>
      <ListGroup>
        {items.map((it, i) => (
          <Pressable key={it.q} accessibilityRole="button" accessibilityState={{ expanded: open === i }} onPress={() => setOpen(open === i ? null : i)} style={{ padding: 14, gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <T size={15} weight="600" style={{ flex: 1 }}>{it.q}</T>
              <Ionicons name={open === i ? 'chevron-up' : 'chevron-down'} size={18} color={night.muted} />
            </View>
            {open === i && <T size={14} lh={1.5} color={night.body}>{it.a}</T>}
          </Pressable>
        ))}
      </ListGroup>
      {tab === 'privacy' && (
        <>
          <SectionLabel>YOUR RIGHTS UNDER POPIA</SectionLabel>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {RIGHTS.map(([t, s]) => (
              <View key={t} style={{ width: '48%', padding: 14, borderRadius: 18, backgroundColor: night.card, borderWidth: 1.5, borderColor: night.line, gap: 2 }}>
                <T size={15} weight="700">{t}</T>
                <T size={13} color={night.muted}>{s}</T>
              </View>
            ))}
          </View>
        </>
      )}
      <TextLink label="Read the full policy" onPress={() => Linking.openURL(support.policyUrl)} />
    </Screen>
  );
}
