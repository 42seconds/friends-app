import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T, H1, Screen, TopBar, StepProgress, Avatar, Card, KV, Note, PrimaryButton, SectionLabel, EventThumb, FirstTicketTracker } from '../../src/components/night';
import { useFirstTicketGuide } from '../../src/hooks/useFirstTicketGuide';
import { useEvent } from '../../src/hooks/useEvents';
import { useAuth } from '../../src/context/AuthContext';
import { useProfile } from '../../src/hooks/useProfile';
import { createTicket, emailNewBooking } from '../../src/services/ticketService';
import { promoStore, NO_PROMO } from '../../src/store';
import { lookupPromo } from '../../src/services/communityService';
import { cartFromParams, cartLines, linesSummary, quoteLines } from '../../src/lib/booking';
import { rand } from '../../src/lib/pricing';
import { shortDate } from '../../src/lib/dates';
import { HOLD_HOURS, SERVICE_FEE_RATE, VAT_RATE } from '../../src/config/pricing';
import { night } from '../../src/theme/night';
import { requireOnline, withTimeout, isOfflineError } from '../../src/lib/online';

// Step 2 of 4: Review booking. Tapping Reserve creates the booking and
// starts the EFT hold.
export default function ReviewBookingScreen() {
  const params = useLocalSearchParams<{ eventId: string; items?: string; tier?: string; qty?: string }>();
  const router = useRouter();
  const { user, emailVerified } = useAuth();
  const { profile } = useProfile();
  const { event } = useEvent(params.eventId);
  const promo = promoStore.useStore();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const guide = useFirstTicketGuide();

  // A code only applies to the event it was entered for, and only for the
  // account that entered it (never the next person on this phone).
  const promoOk = !!promo.code && promo.eventId === params.eventId && !!user && promo.uid === user.uid;
  useEffect(() => {
    if (promo.code && !promoOk) promoStore.set(NO_PROMO);
  }, [params.eventId, user?.uid]);

  // Every ticket type in this booking that's still on sale.
  const lines = cartLines(event, cartFromParams(params));
  const qty = lines.reduce((n, l) => n + l.qty, 0);
  const summary = linesSummary(lines);
  const percentOff = promoOk ? promo.percentOff : 0;
  // A comp (guest-list) code makes the tickets free: no EFT, QR straight away.
  const comp = promoOk && promo.comp;
  const q = quoteLines(lines, percentOff);
  const name = profile?.name ?? user?.email ?? 'You';

  const reserve = async () => {
    if (!user || !event || !lines.length) return;
    if (!emailVerified) {
      router.push('/verify-email?reason=book');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await requireOnline();
      // Check the code again right now: it may have been used up, switched
      // off or expired since it was entered.
      if (promoOk) {
        const again = await withTimeout(lookupPromo(promo.code, params.eventId), 15000);
        if (again.error) {
          promoStore.set(NO_PROMO);
          setError(`Code ${promo.code} can't be used: ${again.error} We've removed it, so check the new total before you reserve.`);
          return;
        }
      }
      const ticketId = await withTimeout(createTicket({
        userId: user.uid,
        userName: profile?.name ?? 'Unknown',
        userEmail: user.email ?? '',
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        eventTime: event.time,
        eventLocation: event.location,
        eventImage: event.image ?? '',
        tag: event.tag,
        // One type: its name, as before. Several: "1 × General, 2 × VIP".
        tier: lines.length === 1 ? lines[0].tier.tier : summary,
        ...(lines.length === 1 ? { price: lines[0].tier.price } : {}),
        quantity: qty,
        items: lines.map((l) => ({ tier: l.tier.tier, qty: l.qty, price: l.tier.price })),
        subtotal: q.subtotal,
        serviceFee: q.serviceFee,
        vat: q.vat,
        discount: q.discount,
        promoCode: promoOk ? promo.code : undefined,
        totalPrice: comp ? 0 : q.total,
        comp,
      }));
      emailNewBooking(ticketId);
      promoStore.set(NO_PROMO);
      router.replace(comp ? `/purchase/confirmed?ticketId=${ticketId}` : `/purchase/pay?ticketId=${ticketId}`);
    } catch (e) {
      console.error('Failed to create ticket:', e);
      const denied = String((e as any)?.code ?? '').includes('permission-denied');
      if (denied && promoOk) promoStore.set(NO_PROMO);
      setError(
        isOfflineError(e)
          ? "You're offline. Reserving tickets needs an internet connection. Your selection is still here, so try again once you're connected."
          : denied
            ? promoOk
              ? `Code ${promo.code} can't be used any more (it may be used up, switched off or expired). We've removed it, so check the new total.`
              : "We couldn't reserve these tickets. Please log out and in again, then try once more."
            : "Something went wrong reserving your tickets. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen header={<><TopBar />{guide ? <FirstTicketTracker step={2} /> : <StepProgress step={2} />}</>} footer={<PrimaryButton label={comp ? 'Get my free tickets' : 'Reserve and pay by EFT'} onPress={reserve} loading={submitting} disabled={!lines.length} />}>
      <H1 size={56}>Review{'\n'}booking</H1>

      {event && (
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 12, borderRadius: 20, backgroundColor: night.ink }}>
          <EventThumb image={event.image} tag={event.tag} size={64} />
          <View style={{ flex: 1, gap: 2 }}>
            <T display size={24} color={night.paper}>{event.title}</T>
            <T size={13} color={night.inkMuted}>{[shortDate(event.date, event.time), event.time && `Doors ${event.time}`].filter(Boolean).join(' · ')}</T>
            <T size={13} color={night.inkMuted}>{event.location}</T>
          </View>
        </View>
      )}

      <View style={{ gap: 8 }}>
        <SectionLabel>WHO'S GOING?</SectionLabel>
        <Card pad={14}>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Avatar name={name} size={38} ring={night.card} />
            <View>
              <T size={15} weight="600">You · {name}</T>
              <T size={13} color={night.muted}>Ticket 1 · {lines[0]?.tier.tier ?? ''}</T>
            </View>
          </View>
          {qty > 1 && (
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <View style={{ width: 38, height: 38, borderRadius: 99, borderWidth: 1.5, borderStyle: 'dashed', borderColor: night.handle, alignItems: 'center', justifyContent: 'center' }}>
                <T size={18} color={night.muted}>+{qty - 1}</T>
              </View>
              <View style={{ flex: 1 }}>
                <T size={15} weight="600">{qty === 2 ? 'Ticket 2' : `Tickets 2–${qty}`} · {summary}</T>
                <T size={13} color={night.muted}>Bring friends in on your QR, or send them a ticket once it's confirmed</T>
              </View>
            </View>
          )}
        </Card>
      </View>

      <Card>
        {lines.map((l) => (
          <KV key={l.tier.tier} k={`${l.qty} × ${l.tier.tier} (face value)`} v={rand(l.tier.price * l.qty)} />
        ))}
        {q.discount > 0 && <KV k={`Code ${promo.code}`} v={`−${rand(q.discount)}`} />}
        <KV k={`Service fee (${Math.round(SERVICE_FEE_RATE * 100)}%)`} v={rand(q.serviceFee)} />
        <KV k={`VAT (${Math.round(VAT_RATE * 100)}%)`} v={rand(q.vat)} />
        <View style={{ borderTopWidth: 1.5, borderStyle: 'dashed', borderColor: night.border, paddingTop: 10 }}>
          <KV k="Total" v={rand(q.total)} strong />
        </View>
        <T size={12} color={night.muted}>Same total you saw on the event page. No surprises.</T>
      </Card>

      <Pressable accessibilityRole="button" onPress={() => router.push(`/purchase/promo?eventId=${params.eventId}&total=${q.total}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, backgroundColor: night.card, borderWidth: 1.5, borderColor: night.line }}>
        <Ionicons name="pricetag-outline" size={20} color={night.ink} />
        <T size={15} weight="600" style={{ flex: 1 }}>{promoOk ? `Code ${promo.code} applied` : 'Add promo or access code'}</T>
        <Ionicons name="chevron-forward" size={18} color={night.muted} />
      </Pressable>

      <Note icon="time-outline">
        <T size={14} lh={1.5} color={night.paper}>
          Next you'll pay by EFT. <T size={14} weight="700" color={night.paper}>We hold your tickets for {HOLD_HOURS} hours</T> from the moment you tap Reserve.
        </T>
      </Note>
      {!!error && <T size={14} weight="600" color={night.danger}>{error}</T>}
    </Screen>
  );
}
