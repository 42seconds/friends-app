import { useMemo, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T, H1, Screen, TopBar, Field, SectionLabel, ListGroup, PrimaryButton, OutlineButton, IconName } from '../../src/components/night';
import { whatsappLink } from '../../src/lib/booking';
import { support } from '../../src/config/payment';
import { SECTIONS, TILES, HelpItem, searchHelp } from '../../src/lib/helpContent';
import { night } from '../../src/theme/night';

const TILE_LOOK: Record<string, { icon: IconName; bg: string }> = {
  eft: { icon: 'card-outline', bg: night.yellow },
  tickets: { icon: 'ticket-outline', bg: night.orange },
  refunds: { icon: 'refresh-outline', bg: night.blue },
  door: { icon: 'qr-code-outline', bg: night.lime },
};

function Answer({ item, open, onToggle }: { item: HelpItem; open: boolean; onToggle: () => void }) {
  const router = useRouter();
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={onToggle} style={{ paddingHorizontal: 16, paddingVertical: 14, gap: 10 }}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <T size={15} weight={open ? '700' : '600'} style={{ flex: 1 }}>{item.q}</T>
        <Ionicons name={open ? 'remove' : 'add'} size={18} color={night.ink} />
      </View>
      {open && (
        <View style={{ gap: 10 }}>
          <T size={14} lh={1.5} color={night.body}>{item.a}</T>
          {item.steps && (
            <View style={{ gap: 8 }}>
              {item.steps.map((s, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                  <View style={{ width: 22, height: 22, borderRadius: 99, backgroundColor: night.ink, alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                    <T mono size={11} weight="700" color={night.lime}>{i + 1}</T>
                  </View>
                  <T size={14} lh={1.45} style={{ flex: 1 }}>{s}</T>
                </View>
              ))}
            </View>
          )}
          {item.go && (
            <Pressable accessibilityRole="link" onPress={() => router.push(item.go!.href as any)} style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 14, borderRadius: 99, backgroundColor: night.ink }}>
              <T size={13} weight="600" color={night.paper}>{item.go.label}</T>
              <Ionicons name="arrow-forward" size={14} color={night.lime} />
            </Pressable>
          )}
        </View>
      )}
    </Pressable>
  );
}

export default function HelpScreen() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [tile, setTile] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>('How do I get my first ticket?');

  const topics = tile ? TILES.find((t) => t.key === tile)!.topics : undefined;
  const shown = useMemo(() => searchHelp(q, topics), [q, tile]);
  const groups = SECTIONS.map((s) => ({ ...s, items: shown.filter((f) => f.topic === s.key) })).filter((g) => g.items.length);
  const filtering = !!q.trim() || !!tile;

  return (
    <Screen header={<TopBar />}>
      <H1 size={56}>Help</H1>
      <Field value={q} onChangeText={setQ} placeholder="Search help, e.g. reference, refund" left={<Ionicons name="search" size={18} color={night.muted} />} right={q ? <Pressable accessibilityLabel="Clear search" onPress={() => setQ('')} hitSlop={8}><Ionicons name="close-circle" size={18} color={night.muted} /></Pressable> : undefined} />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {TILES.map((t) => {
          const on = tile === t.key; const look = TILE_LOOK[t.key];
          return (
            <Pressable key={t.key} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => setTile(on ? null : t.key)} style={{ width: '48.5%', padding: 14, borderRadius: 18, backgroundColor: look.bg, gap: 14, borderWidth: 2, borderColor: on ? night.ink : 'transparent' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Ionicons name={look.icon} size={22} color={night.ink} />
                {on && <Ionicons name="checkmark-circle" size={20} color={night.ink} />}
              </View>
              <T display size={22}>{t.label}</T>
            </Pressable>
          );
        })}
      </View>

      <Pressable accessibilityRole="button" onPress={() => router.push('/guide?replay=1')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, backgroundColor: night.orange }}>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: night.ink, alignItems: 'center', justifyContent: 'center' }}>
          <T display size={26} color={night.orange} style={{ marginTop: 3 }}>&amp;</T>
        </View>
        <View style={{ flex: 1 }}>
          <T size={15} weight="700">How &amp;FRIENDS works</T>
          <T size={13}>A 1-minute guide, from tickets to the door</T>
        </View>
        <Ionicons name="play-circle" size={26} color={night.ink} />
      </Pressable>

      {filtering && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <T size={13} color={night.muted}>{shown.length} answer{shown.length === 1 ? '' : 's'}{tile ? ` in ${TILES.find((t) => t.key === tile)!.label}` : ''}</T>
          <Pressable onPress={() => { setQ(''); setTile(null); }} hitSlop={8}><T size={13} weight="600" style={{ textDecorationLine: 'underline' }}>Show all</T></Pressable>
        </View>
      )}

      {groups.map((g) => (
        <View key={g.key} style={{ gap: 8 }}>
          <SectionLabel>{g.title.toUpperCase()}</SectionLabel>
          <ListGroup>
            {g.items.map((f) => (
              <Answer key={f.q} item={f} open={open === f.q} onToggle={() => setOpen(open === f.q ? null : f.q)} />
            ))}
          </ListGroup>
        </View>
      ))}
      {!shown.length && (
        <View style={{ alignItems: 'center', gap: 6, paddingVertical: 18 }}>
          <Ionicons name="search-outline" size={28} color={night.muted} />
          <T size={14} color={night.muted} center>No answers match "{q}". Try another word, or ask us below.</T>
        </View>
      )}

      <SectionLabel>STILL STUCK?</SectionLabel>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <PrimaryButton label="WhatsApp us" icon="logo-whatsapp" arrow={false} center style={{ flex: 1 }} onPress={() => Linking.openURL(whatsappLink('Hi &FRIENDS, I need help with…', support.whatsapp))} />
        <OutlineButton label="Email" icon="mail-outline" style={{ flex: 1 }} height={58} onPress={() => Linking.openURL(`mailto:${support.email}?subject=Help with the %26FRIENDS app`)} />
      </View>
      <T size={13} color={night.muted} center>We reply {support.hours}. Include your booking reference (TKT-…) if it's about a ticket.</T>
      <Pressable accessibilityRole="button" onPress={() => Linking.openURL(whatsappLink('Safety report: ', support.whatsapp))} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, backgroundColor: night.pink }}>
        <Ionicons name="shield-outline" size={22} color={night.danger} />
        <View style={{ flex: 1 }}>
          <T size={15} weight="700" color={night.danger}>Report a safety issue</T>
          <T size={13} color={night.body}>At an event, or with another member</T>
        </View>
        <Ionicons name="chevron-forward" size={18} color={night.ink} />
      </Pressable>
    </Screen>
  );
}
