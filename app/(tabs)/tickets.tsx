import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T, H1, Screen, Segmented, Amp, Avatar, Pill, EmptyState, PrimaryButton, TextLink, EventRow } from '../../src/components/night';
import StatusBadge from '../../src/components/statusBadge';
import { useBookings } from '../../src/hooks/useBookings';
import { useAuth } from '../../src/context/AuthContext';
import { effectiveStatus } from '../../src/services/ticketService';
import { bookingHref } from '../../src/lib/booking';
import { isPast, relativeDay, shortDate } from '../../src/lib/dates';
import { subBrandFor } from '../../src/lib/subbrands';
import { night } from '../../src/theme/night';
import { PurchasedTicket } from '../../src/types';

type Tab = 'upcoming' | 'pending' | 'past';

function TicketCard({ t }: { t: PurchasedTicket }) {
  const router = useRouter();
  const brand = subBrandFor(t.tag);
  const when = relativeDay(t.eventDate, t.eventTime);
  const transfer = t.transfer?.status === 'pending' ? t.transfer : null;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${t.eventTitle} ticket`} onPress={() => router.push(`/ticket/${t.id}`)}>
      {/* the "stacked tickets" edge behind multi-ticket bookings */}
      {t.quantity > 1 && <View style={{ position: 'absolute', left: 12, right: 12, top: -6, height: 30, borderRadius: 20, backgroundColor: brand.deep }} />}
      <View style={{ borderRadius: 24, overflow: 'hidden', backgroundColor: night.ink }}>
        <View style={{ backgroundColor: brand.color, padding: 18, gap: 18, overflow: 'hidden' }}>
          <Amp size={260} color={brand.deep} style={{ right: -30, top: -40 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Pill label={t.quantity > 1 ? `${t.quantity} tickets` : '1 ticket'} bg={night.ink} color={night.paper} />
            {when && <Pill label={when} bg={night.paper} />}
          </View>
          <T display size={52} lh={0.86}>{t.eventTitle}</T>
          <View>
            <T size={14} weight="600">{[shortDate(t.eventDate, t.eventTime), t.eventTime && `Doors ${t.eventTime}`].filter(Boolean).join(' · ')}</T>
            <T size={14}>{t.eventLocation}</T>
          </View>
        </View>
        <View style={{ padding: 14, gap: 10 }}>
          {transfer && (
            <Pressable onPress={() => router.push(`/ticket/transfer?ticketId=${t.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 14, backgroundColor: night.ink2 }}>
              <Avatar name={transfer.toName} size={28} ring={night.ink2} />
              <T size={13} color={night.paper} style={{ flex: 1 }}>Ticket sent to {transfer.toName.split(' ')[0]} · waiting</T>
              <T size={12} weight="700" color={night.yellow}>Pending</T>
            </Pressable>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <T size={14} weight="600" color={night.paper}>{t.tier}</T>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="qr-code-outline" size={16} color={night.orange} />
              <T size={13} weight="600" color={night.paper}>Show QR</T>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function TicketsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { tickets, loading } = useBookings();
  const [tab, setTab] = useState<Tab>('upcoming');

  const groups = useMemo(() => {
    const upcoming: PurchasedTicket[] = [];
    const pending: PurchasedTicket[] = [];
    const past: PurchasedTicket[] = [];
    for (const t of tickets) {
      const s = effectiveStatus(t);
      if (isPast(t.eventDate, t.eventTime) || s === 'expired' || s === 'cancelled') past.push(t);
      else if (s === 'confirmed') upcoming.push(t);
      else pending.push(t);
    }
    return { upcoming, pending, past };
  }, [tickets]);

  if (!user) {
    return (
      <Screen tabBar fill contentStyle={{ justifyContent: 'center' }}>
        <EmptyState icon="ticket-outline" tileBg={night.orange} title="Your tickets live here" body="Log in to book, and your tickets will work even without data.">
          <PrimaryButton label="Log in" onPress={() => router.push('/(auth)/login')} />
          <TextLink label="Create an account" onPress={() => router.push('/(auth)/register')} />
        </EmptyState>
      </Screen>
    );
  }

  const nudge = groups.pending.find((t) => ['pending_verification', 'rejected', 'pending_payment'].includes(effectiveStatus(t)));
  const list = groups[tab];

  return (
    <Screen
      tabBar
      header={
        <>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <H1 size={52}>Tickets</H1>
            <TextLink label="Purchases" onPress={() => router.push('/receipts')} />
          </View>
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { key: 'upcoming', label: `Upcoming · ${groups.upcoming.length}` },
              { key: 'pending', label: `Pending · ${groups.pending.length}` },
              { key: 'past', label: `Past · ${groups.past.length}` },
            ]}
          />
        </>
      }
    >

      {nudge && tab !== 'pending' && (
        <Pressable onPress={() => router.push(bookingHref(nudge) as any)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 18, backgroundColor: night.cream }}>
          <View style={{ width: 10, height: 10, borderRadius: 99, backgroundColor: effectiveStatus(nudge) === 'rejected' ? night.danger : night.yellow }} />
          <T size={14} style={{ flex: 1 }}>
            <T size={14} weight="700">{nudge.eventTitle}</T>{' '}
            {effectiveStatus(nudge) === 'rejected' ? 'needs a new proof' : effectiveStatus(nudge) === 'pending_payment' ? 'is waiting for your EFT' : 'is waiting on payment check'}
          </T>
          <Ionicons name="chevron-forward" size={18} color={night.muted} />
        </Pressable>
      )}

      {loading ? (
        <ActivityIndicator color={night.ink} style={{ marginTop: 30 }} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={tab === 'past' ? 'time-outline' : 'ticket-outline'}
          tileBg={night.orange}
          title={tab === 'upcoming' ? 'No tickets yet' : tab === 'pending' ? 'Nothing pending' : 'No past tickets'}
          body={tab === 'upcoming' ? 'When you book, your tickets live here and work even without data.' : tab === 'pending' ? 'Bookings waiting on payment show up here.' : 'Nights you went to will show up here.'}
        >
          {tab === 'upcoming' && <PrimaryButton label="See what's on" onPress={() => router.push('/(tabs)/home')} />}
        </EmptyState>
      ) : tab === 'upcoming' ? (
        <View style={{ gap: 18 }}>
          {list.map((t) => (
            <TicketCard key={t.id} t={t} />
          ))}
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="cloud-offline-outline" size={16} color={night.muted} />
            <T size={13} color={night.muted}>Open your QR before you leave home in case signal is bad.</T>
          </View>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {list.map((t) => (
            <EventRow
              key={t.id}
              title={t.eventTitle ?? 'Booking'}
              subtitle={`${t.quantity} × ${t.tier} · ${shortDate(t.eventDate, t.eventTime)}`}
              image={t.eventImage}
              tag={t.tag}
              date={t.eventDate}
              time={t.eventTime}
              onPress={() => router.push((tab === 'past' && effectiveStatus(t) === 'confirmed' ? `/rate/${t.eventId}` : bookingHref(t)) as any)}
              right={<StatusBadge status={effectiveStatus(t)} />}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}
