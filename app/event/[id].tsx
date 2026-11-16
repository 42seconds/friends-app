import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, Share, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T, H1, H2, Amp, Screen, IconButton, Stepper, Note, Card, Pill, PrimaryButton, EmptyState, TextLink, CoachMark, FirstTicketTracker, TierRow } from '../../src/components/night';
import { useFirstTicketGuide } from '../../src/hooks/useFirstTicketGuide';
import { useEvent } from '../../src/hooks/useEvents';
import { useAuth } from '../../src/context/AuthContext';
import { savedStore, toggleSaved } from '../../src/store';
import { subBrandFor } from '../../src/lib/subbrands';
import { allIn, rand } from '../../src/lib/pricing';
import { addToCalendar, Cart, cartCount, cartLines, cartParams, linesSummary, cartShort, maxFor, quoteLines, setCartQty } from '../../src/lib/booking';
import { allSoldOut, tierState } from '../../src/lib/tiers';
import { isPast, shortDate } from '../../src/lib/dates';
import { HOLD_HOURS, MAX_TICKETS_PER_PERSON } from '../../src/config/pricing';
import { night } from '../../src/theme/night';
import { safeBack } from '../../src/lib/nav';
import { useOnline } from '../../src/hooks/useOnline';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, emailVerified } = useAuth();
  const { event, loading } = useEvent(id);
  const saved = savedStore.useStore().ids.includes(id ?? '');
  // Several ticket types can go in one booking (e.g. 2 General + 1 VIP),
  // up to the per-person limit in total.
  const [cart, setCart] = useState<Cart>({});
  const guide = useFirstTicketGuide();
  const online = useOnline();

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', backgroundColor: night.paper }}><ActivityIndicator color={night.ink} /></View>;
  if (!event) {
    return (
      <Screen>
        <EmptyState icon="alert-circle-outline" title="Event not found" body="It may have been moved or taken down.">
          <PrimaryButton label="Back to Explore" onPress={() => router.replace('/(tabs)/home')} />
        </EmptyState>
      </Screen>
    );
  }

  const brand = subBrandFor(event.tag);
  const available = event.tickets?.filter((t) => tierState(t) === 'on_sale') ?? [];
  const lines = cartLines(event, cart);
  const count = cartCount(cart);
  const q = quoteLines(lines);
  // Sold out on the website, or every ticket type is gone.
  const soldOut = !!event.soldOut || allSoldOut(event.tickets);
  const lineupCount = event.lineup?.length ?? 0;
  // Already happened: show it, but no tickets or booking.
  const over = isPast(event.date, event.time);

  const reserve = () => {
    if (!count) return;
    if (!online) {
      Alert.alert("You're offline", 'You can keep browsing, but reserving tickets needs an internet connection.');
      return;
    }
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    if (!emailVerified) {
      router.push('/verify-email?reason=book');
      return;
    }
    router.push(`/purchase/tickets?${cartParams(event.id, cart)}`);
  };

  const footer = over ? (
    <PrimaryButton label={event.gallery?.length ? 'See the photos' : 'See what\'s on next'} onPress={() => (event.gallery?.length ? router.push(`/gallery/${event.id}`) : router.replace('/(tabs)/home'))} />
  ) : soldOut ? (
    <PrimaryButton label="Sold out · join the waitlist" onPress={() => router.push(`/waitlist/${event.id}`)} />
  ) : available.length === 0 ? null : (
    <CoachMark id="event-reserve" after="event-stepper" show={!!count} placement="above" tailAlign="right" number={2} text="Then tap Reserve. Reserving is free.">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ minWidth: 96, maxWidth: 150 }}>
          <T size={13} color={night.muted} numberOfLines={2}>{count ? cartShort(lines) : 'Pick tickets'}</T>
          <T display size={28}>{count ? rand(q.total) : '—'}</T>
        </View>
        <PrimaryButton label="Reserve tickets" disabled={!count} onPress={reserve} style={{ flex: 1 }} />
      </View>
    </CoachMark>
  );

  return (
    <Screen
      padTop={false}
      footer={footer}
      headerBg={brand.color}
      header={
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <IconButton icon="arrow-back" label="Back" tone="ink" onPress={() => safeBack(router, '/(tabs)/home')} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <IconButton icon={saved ? 'heart' : 'heart-outline'} label={saved ? 'Unsave' : 'Save'} tone="ink" onPress={() => toggleSaved(event.id)} />
            <IconButton icon="share-outline" label="Share" tone="ink" onPress={() => Share.share({ message: `${event.title} · ${shortDate(event.date, event.time)} · ${event.location}` })} />
          </View>
        </View>
      }
      hero={
        <View style={{ backgroundColor: brand.color, paddingTop: 12, paddingHorizontal: 20, paddingBottom: 22, minHeight: 250, overflow: 'hidden', justifyContent: 'space-between' }}>
          {event.image ? <Image source={{ uri: event.image }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} /> : <Amp size={380} color={brand.deep} style={{ right: -50, top: 10 }} />}
          {!!event.image && <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%', backgroundColor: 'rgba(21,19,15,0.5)' }} />}
          <View style={{ gap: 10, marginTop: 40 }}>
            <View style={{ alignSelf: 'flex-start', backgroundColor: night.ink, paddingHorizontal: 10, paddingTop: 5, paddingBottom: 3, borderRadius: 8 }}>
              <T display size={16} color={brand.color}>{brand.name}</T>
            </View>
            <H1 size={64} color={event.image ? night.paper : night.ink}>{event.title}</H1>
          </View>
        </View>
      }
    >
      {guide && !over && !soldOut && <FirstTicketTracker step={2} />}
      {over && (
        <Note icon="time-outline" tone="cream">
          <T size={13} lh={1.5}>This event has already happened, so tickets are closed.</T>
        </Note>
      )}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Card style={{ flex: 1, gap: 4 }} pad={14}>
          <T mono weight="700" size={11} color={night.muted}>WHEN</T>
          <T size={15} weight="600">{[shortDate(event.date, event.time), event.time].filter(Boolean).join(', ')}</T>
          {!over && <TextLink label="Add to calendar" size={13} onPress={() => addToCalendar(event)} />}
        </Card>
        <Card style={{ flex: 1, gap: 4 }} pad={14}>
          <T mono weight="700" size={11} color={night.muted}>WHERE</T>
          <Pressable onPress={() => router.push(`/venue/${encodeURIComponent(event.location)}`)}>
            <T size={15} weight="600" numberOfLines={2}>{event.location}</T>
          </Pressable>
          <TextLink label="Directions" size={13} onPress={() => router.push(`/directions/${event.id}`)} />
        </Card>
      </View>

      {lineupCount > 0 && (
        <Pressable accessibilityRole="button" onPress={() => router.push(`/lineup/${event.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, backgroundColor: night.card, borderWidth: 1.5, borderColor: night.line }}>
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: night.ink, alignItems: 'center', justifyContent: 'center' }}>
            <T display size={26} color={night.orange}>{lineupCount}</T>
          </View>
          <View style={{ flex: 1 }}>
            <T size={15} weight="600">Lineup and set times</T>
            <T size={13} color={night.muted}>{event.time ? `Doors ${event.time}` : 'Who is playing'}</T>
          </View>
          <Ionicons name="chevron-forward" size={18} color={night.muted} />
        </Pressable>
      )}

      {!over && !soldOut && !!event.tickets?.length && (
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <H2>Tickets</H2>
            <T size={12} color={night.muted}>Prices include fees + VAT</T>
          </View>
          {event.tickets.map((t, i) => {
            const first = event.tickets!.findIndex((x) => tierState(x) === 'on_sale') === i;
            return (
              <CoachMark key={t.tier} id="event-stepper" show={first} number={1} tailAlign="right" text="Choose how many with + and −. You can mix ticket types. The price already includes fees and VAT.">
                <TierRow
                  tier={t}
                  qty={cart[t.tier] ?? 0}
                  max={maxFor(cart, t.tier, MAX_TICKETS_PER_PERSON, t.remaining)}
                  onChange={(n) => setCart((c) => setCartQty(c, t.tier, n))}
                  onWaitlist={() => router.push(`/waitlist/join?eventId=${event.id}&tier=${encodeURIComponent(t.tier)}`)}
                />
              </CoachMark>
            );
          })}
          <T size={12} color={night.muted}>Mix ticket types if you like · max {MAX_TICKETS_PER_PERSON} per person</T>
        </View>
      )}

      {!over && <Note icon="time-outline">
        <T size={14} lh={1.5} color={night.paper}>
          <T size={14} weight="700" color={night.paper}>We hold your tickets for {HOLD_HOURS} hours</T> while you pay by EFT. No card, no 3D Secure, no OTP drama.
        </T>
      </Note>}

      {!!event.description && (
        <View style={{ gap: 6 }}>
          <H2>About</H2>
          <T size={15} lh={1.55} color={night.body}>{event.description}</T>
        </View>
      )}
    </Screen>
  );
}
