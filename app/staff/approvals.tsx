import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { T, H1, Screen, Hero, TopBar, StaffGate, StaffPill, Chip, SectionLabel, Pill, PrimaryButton, EmptyState } from '../../src/components/night';
import { listenToTicketsByStatus } from '../../src/services/ticketService';
import { ago } from '../../src/lib/dates';
import { rand } from '../../src/lib/pricing';
import { subBrandFor } from '../../src/lib/subbrands';
import { night } from '../../src/theme/night';
import { PurchasedTicket, TicketStatus } from '../../src/types';

const TABS: { key: TicketStatus; label: string }[] = [
  { key: 'pending_verification', label: 'To review' },
  { key: 'pending_payment', label: 'Waiting' },
  { key: 'rejected', label: 'Re-upload' },
];

// Payment approvals queue, oldest first.
export default function ApprovalsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<TicketStatus>('pending_verification');
  const [lists, setLists] = useState<Record<string, PurchasedTicket[]>>({});

  useEffect(() => {
    const unsubs = TABS.map((t) => listenToTicketsByStatus(t.key, (xs) => setLists((l) => ({ ...l, [t.key]: xs }))));
    return () => unsubs.forEach((u) => u());
  }, []);

  const list = lists[tab] ?? [];
  const review = lists.pending_verification ?? [];

  return (
    <StaffGate>
      <Screen header={<TopBar dark onBack={() => (router.canGoBack() ? router.back() : router.replace('/staff'))} center={<StaffPill />} />} headerBg={night.ink}
        padTop={false}
        footer={tab === 'pending_verification' && review.length ? <PrimaryButton label={`Start reviewing · ${review.length}`} onPress={() => router.push(`/staff/review/${review[0].id}`)} /> : undefined}
        hero={
          <Hero bg={night.ink} gap={14}>
              <H1 size={52} color={night.paper}>Approvals</H1>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {TABS.map((t) => (
                  <Chip key={t.key} dark label={`${t.label} · ${(lists[t.key] ?? []).length}`} active={tab === t.key} activeColor={night.orange} onPress={() => setTab(t.key)} />
                ))}
              </View>
          </Hero>
        }
      >
        <SectionLabel right={<T size={12} color={night.muted}>Guests wait on these</T>}>OLDEST FIRST</SectionLabel>
        {!list.length && <EmptyState icon="checkmark-done-outline" tileBg={night.lime} title="All clear" body="Nothing in this queue right now." />}
        {list.map((t, i) => (
          <Pressable key={t.id} accessibilityRole="button" onPress={() => router.push(`/staff/review/${t.id}`)} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 12, borderRadius: 18, backgroundColor: night.card, borderWidth: 1.5, borderColor: night.line }}>
            <View style={{ width: 44, height: 54, borderRadius: 8, backgroundColor: night.paper, borderWidth: 1, borderColor: night.border, padding: 6, paddingVertical: 8, gap: 4 }}>
              <View style={{ height: 3, backgroundColor: night.handle }} />
              <View style={{ height: 3, width: '70%', backgroundColor: night.handle }} />
              <View style={{ height: 3, backgroundColor: subBrandFor(t.tag).color }} />
              <View style={{ height: 3, width: '50%', backgroundColor: night.ink }} />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <T size={15} weight="600" numberOfLines={1} style={{ flexShrink: 1 }}>{t.userName ?? 'Guest'}</T>
                {i === 0 && list.length > 1 && <Pill label="Oldest" bg={night.pink} color={night.pinkText} />}
              </View>
              <T size={13} color={night.muted} numberOfLines={1}>{t.eventTitle} · {t.quantity > 1 ? `${t.quantity} × ` : ''}{t.tier}</T>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 3 }}>
              <T mono weight="700" size={14}>{rand(t.totalPrice)}</T>
              <T mono size={11} color={night.muted}>{ago(t.proofUploadedAt ?? t.createdAt)}</T>
            </View>
          </Pressable>
        ))}
      </Screen>
    </StaffGate>
  );
}
