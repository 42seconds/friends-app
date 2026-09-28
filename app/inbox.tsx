import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T, H1, Screen, TopBar, Chip, SectionLabel, EmptyState, IconName } from '../src/components/night';
import { useBookings } from '../src/hooks/useBookings';
import { effectiveStatus } from '../src/services/ticketService';
import { bookingHref } from '../src/lib/booking';
import { ago, isPast } from '../src/lib/dates';
import { night } from '../src/theme/night';

type Kind = 'tickets' | 'friends';

interface Item {
  id: string;
  kind: Kind;
  icon: IconName;
  tile: string;
  title: string;
  body: string;
  at: string;
  cta?: { label: string; href: string; tone: string };
}

// Notification feed, built from the user's own bookings so it is always
// in step with what actually happened to them.
export default function InboxScreen() {
  const router = useRouter();
  const { tickets } = useBookings();
  const [filter, setFilter] = useState<'all' | Kind>('all');

  const items = useMemo(() => {
    const out: Item[] = [];
    for (const t of tickets) {
      const s = effectiveStatus(t);
      const ev = t.eventTitle ?? 'your event';
      if (s === 'confirmed') out.push({ id: `${t.id}-ok`, kind: 'tickets', icon: 'checkmark-circle', tile: night.orange, title: 'Your tickets are ready', body: `Payment approved for ${ev}.`, at: t.validatedAt ?? t.createdAt, cta: { label: 'View tickets', href: `/ticket/${t.id}`, tone: night.ink } });
      if (s === 'rejected') out.push({ id: `${t.id}-rej`, kind: 'tickets', icon: 'alert-circle', tile: night.danger, title: 'Your proof needs a fix', body: `${t.rejection?.reason ?? 'We could not confirm your payment'} · ${ev}.`, at: t.rejection?.at ?? t.createdAt, cta: { label: 'Fix it', href: bookingHref(t), tone: night.ink } });
      if (s === 'pending_verification') out.push({ id: `${t.id}-chk`, kind: 'tickets', icon: 'hourglass-outline', tile: night.yellow, title: `Still checking ${ev}`, body: 'Your proof is in the queue. Nothing to do yet.', at: t.proofUploadedAt ?? t.createdAt });
      if (s === 'pending_payment') out.push({ id: `${t.id}-pay`, kind: 'tickets', icon: 'card-outline', tile: night.cream, title: 'Finish paying by EFT', body: `Your tickets for ${ev} are held for you.`, at: t.createdAt, cta: { label: 'Pay now', href: bookingHref(t), tone: night.ink } });
      if (s === 'expired') out.push({ id: `${t.id}-exp`, kind: 'tickets', icon: 'time-outline', tile: night.sand, title: 'Your hold ran out', body: `The tickets for ${ev} went back on sale.`, at: t.holdExpiresAt ?? t.createdAt, cta: { label: 'See options', href: bookingHref(t), tone: night.ink } });
      if (t.transfer) out.push({ id: `${t.id}-tr`, kind: 'friends', icon: 'paper-plane-outline', tile: night.blue, title: t.transfer.status === 'accepted' ? `${t.transfer.toName} accepted your ticket` : `Ticket sent to ${t.transfer.toName}`, body: t.transfer.status === 'pending' ? 'Waiting for them to accept.' : `For ${ev}.`, at: t.transfer.sentAt });
      if (s === 'confirmed' && isPast(t.eventDate, t.eventTime)) out.push({ id: `${t.id}-rate`, kind: 'tickets', icon: 'star-outline', tile: night.sand, title: `How was ${ev}?`, body: 'Rate the night.', at: t.eventDate ?? t.createdAt, cta: { label: 'Rate it', href: `/rate/${t.eventId}`, tone: night.card } });
    }
    return out.sort((a, b) => (b.at ?? '').localeCompare(a.at ?? ''));
  }, [tickets]);

  const shown = items.filter((i) => filter === 'all' || i.kind === filter);
  const dayAgo = Date.now() - 86400000;
  const today = shown.filter((i) => new Date(i.at).getTime() > dayAgo);
  const earlier = shown.filter((i) => !(new Date(i.at).getTime() > dayAgo));

  const Row = ({ i }: { i: Item }) => (
    <View style={{ flexDirection: 'row', gap: 12, padding: 14, borderRadius: 18, backgroundColor: night.card, borderWidth: 1.5, borderColor: night.line }}>
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: i.tile, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={i.icon} size={20} color={i.tile === night.danger ? night.paper : night.ink} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
          <T size={15} weight="600" style={{ flex: 1 }}>{i.title}</T>
          <T size={12} color={night.muted}>{ago(i.at)}</T>
        </View>
        <T size={13} color={night.muted}>{i.body}</T>
        {i.cta && (
          <Pressable onPress={() => router.push(i.cta!.href as any)} style={{ alignSelf: 'flex-start', marginTop: 6, height: 34, paddingHorizontal: 14, borderRadius: 999, backgroundColor: i.cta.tone, borderWidth: i.cta.tone === night.card ? 1.5 : 0, borderColor: night.border, justifyContent: 'center' }}>
            <T size={13} weight="600" color={i.cta.tone === night.ink ? night.paper : night.ink}>{i.cta.label}</T>
          </Pressable>
        )}
      </View>
    </View>
  );

  return (
    <Screen header={<TopBar />}>
      <H1 size={56}>Notifications</H1>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Chip label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
        <Chip label="Tickets" active={filter === 'tickets'} onPress={() => setFilter('tickets')} />
        <Chip label="Friends" active={filter === 'friends'} onPress={() => setFilter('friends')} />
      </View>
      {!shown.length ? (
        <EmptyState icon="notifications-outline" title="All quiet" body="Updates about your tickets, payments and transfers land here." />
      ) : (
        <>
          {today.length > 0 && <SectionLabel>TODAY</SectionLabel>}
          {today.map((i) => <Row key={i.id} i={i} />)}
          {earlier.length > 0 && <SectionLabel>EARLIER</SectionLabel>}
          {earlier.map((i) => <Row key={i.id} i={i} />)}
        </>
      )}
    </Screen>
  );
}
