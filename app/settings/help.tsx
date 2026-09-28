import { useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { T, H1, Screen, TopBar, Field, SectionLabel, ListGroup, PrimaryButton, OutlineButton, IconName } from '../../src/components/night';
import { whatsappLink } from '../../src/lib/booking';
import { support } from '../../src/config/payment';
import { HOLD_HOURS } from '../../src/config/pricing';
import { night } from '../../src/theme/night';

const TOPICS: { key: string; label: string; icon: IconName; bg: string }[] = [
  { key: 'eft', label: 'Paying by EFT', icon: 'card-outline', bg: night.yellow },
  { key: 'tickets', label: 'My tickets', icon: 'ticket-outline', bg: night.orange },
  { key: 'refunds', label: 'Refunds', icon: 'refresh-outline', bg: night.blue },
  { key: 'door', label: 'At the door', icon: 'qr-code-outline', bg: night.lime },
];

const FAQ: { topic: string; q: string; a: string }[] = [
  { topic: 'eft', q: 'How long does payment checking take?', a: `Usually within a few hours. You'll get a notification the moment your QR is ready, and your tickets stay held for ${HOLD_HOURS} hours while we check.` },
  { topic: 'eft', q: 'I paid but used the wrong reference', a: "Upload your proof anyway. We match payments by amount and date too, and we'll contact you if we can't find it." },
  { topic: 'eft', q: 'My hold ran out but I already paid', a: "Open the booking and tap \"I already paid, upload proof\". We'll sort it out, or refund you." },
  { topic: 'tickets', q: 'Can I send a ticket to a friend?', a: 'Yes. Open your ticket and tap Send. Your friend gets a WhatsApp link and the ticket stays yours until they accept.' },
  { topic: 'refunds', q: 'Can I get a refund?', a: "Refunds are for cancelled or moved events. Otherwise, release your ticket to the waitlist and you're refunded when someone claims it." },
  { topic: 'door', q: 'My phone died. Can I still get in?', a: 'Tell the door team your name. They can find you on the guest list and check you in by ticket ID.' },
  { topic: 'door', q: 'Do I need ID?', a: 'Night events are 18+, so bring ID.' },
];

export default function HelpScreen() {
  const [q, setQ] = useState('');
  const [topic, setTopic] = useState<string | null>(null);
  const [open, setOpen] = useState<number | null>(0);
  const query = q.trim().toLowerCase();
  const shown = FAQ.filter((f) => (!topic || f.topic === topic) && (!query || (f.q + f.a).toLowerCase().includes(query)));

  return (
    <Screen header={<TopBar />}>
      <H1 size={60}>Help</H1>
      <Field value={q} onChangeText={setQ} placeholder="Search help" left={<Ionicons name="search" size={18} color={night.muted} />} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {TOPICS.map((t) => (
          <Pressable key={t.key} accessibilityRole="button" accessibilityState={{ selected: topic === t.key }} onPress={() => setTopic(topic === t.key ? null : t.key)} style={{ width: '48%', padding: 14, borderRadius: 18, backgroundColor: t.bg, gap: 14, borderWidth: topic === t.key ? 2 : 0, borderColor: night.ink }}>
            <Ionicons name={t.icon} size={22} color={night.ink} />
            <T size={15} weight="700">{t.label}</T>
          </Pressable>
        ))}
      </View>
      <SectionLabel>COMMON QUESTIONS</SectionLabel>
      <ListGroup>
        {shown.map((f, i) => (
          <Pressable key={f.q} accessibilityRole="button" accessibilityState={{ expanded: open === i }} onPress={() => setOpen(open === i ? null : i)} style={{ padding: 14, gap: 8 }}>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <T size={15} weight="600" style={{ flex: 1 }}>{f.q}</T>
              <Ionicons name={open === i ? 'remove' : 'add'} size={18} color={night.ink} />
            </View>
            {open === i && <T size={14} lh={1.5} color={night.body}>{f.a}</T>}
          </Pressable>
        ))}
      </ListGroup>
      {!shown.length && <T size={14} color={night.muted} center>No answers match. Ask us below.</T>}
      <SectionLabel>STILL STUCK?</SectionLabel>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <PrimaryButton label="WhatsApp us" icon="logo-whatsapp" arrow={false} center style={{ flex: 1 }} onPress={() => Linking.openURL(whatsappLink('Hi &FRIENDS, I need help with…', support.whatsapp))} />
        <OutlineButton label="Email" icon="mail-outline" style={{ flex: 1 }} height={58} onPress={() => Linking.openURL(`mailto:${support.email}`)} />
      </View>
      <Pressable accessibilityRole="button" onPress={() => Linking.openURL(whatsappLink('Safety report: ', support.whatsapp))} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, backgroundColor: night.pink }}>
        <Ionicons name="shield-outline" size={22} color={night.danger} />
        <View style={{ flex: 1 }}>
          <T size={15} weight="700">Report a safety issue</T>
          <T size={13} color={night.body}>At an event, or with another member</T>
        </View>
        <Ionicons name="chevron-forward" size={18} color={night.ink} />
      </Pressable>
    </Screen>
  );
}
