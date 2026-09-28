import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, Share, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T, H1, H2, Amp, Screen, IconButton, Stepper, Note, Card, Pill, PrimaryButton, EmptyState, TextLink } from '../../src/components/night';
import { useEvent } from '../../src/hooks/useEvents';
import { useAuth } from '../../src/context/AuthContext';
import { savedStore, toggleSaved } from '../../src/store';
import { subBrandFor } from '../../src/lib/subbrands';
import { allIn, rand } from '../../src/lib/pricing';
import { addToCalendar, quote, selectionParams } from '../../src/lib/booking';
import { shortDate } from '../../src/lib/dates';
import { HOLD_HOURS, MAX_TICKETS_PER_PERSON } from '../../src/config/pricing';
import { night } from '../../src/theme/night';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { event, loading } = useEvent(id);
  const saved = savedStore.useStore().ids.includes(id ?? '');
  // One tier per booking: picking a quantity on one tier clears the others.
  const [sel, setSel] = useState<{ tier: string; qty: number } | null>(null);

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
  const available = event.tickets?.filter((t) => t.available) ?? [];
  const tier = event.tickets?.find((t) => t.tier === sel?.tier);
  const q = quote(tier, sel?.qty ?? 0);
  const lineupCount = event.lineup?.length ?? 0;

  const reserve = () => {
    if (!sel?.qty) return;
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    router.push(`/purchase/tickets?${selectionParams(event.id, sel)}`);
  };

  const footer = event.soldOut ? (
    <PrimaryButton label="Sold out · join the waitlist" onPress={() => router.push(`/waitlist/${event.id}`)} />
  ) : available.length === 0 ? null : (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <View style={{ minWidth: 96 }}>
        <T size={13} color={night.muted}>{sel?.qty ? `${sel.qty} × ${sel.tier}` : 'Pick tickets'}</T>
        <T display size={28}>{sel?.qty ? rand(q.total) : '—'}</T>
      </View>
      <PrimaryButton label="Reserve tickets" disabled={!sel?.qty} onPress={reserve} style={{ flex: 1 }} />
    </View>
  );

  return (
    <Screen
      padTop={false}
      footer={footer}
      hero={
        <View style={{ backgroundColor: brand.color, paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 22, minHeight: 330, overflow: 'hidden', justifyContent: 'space-between' }}>
          {event.image ? <Image source={{ uri: event.image }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} /> : <Amp size={380} color={brand.deep} style={{ right: -50, top: 10 }} />}
          {!!event.image && <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%', backgroundColor: 'rgba(21,19,15,0.5)' }} />}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <IconButton icon="arrow-back" label="Back" tone="ink" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <IconButton icon={saved ? 'heart' : 'heart-outline'} label={saved ? 'Unsave' : 'Save'} tone="ink" onPress={() => toggleSaved(event.id)} />
              <IconButton icon="share-outline" label="Share" tone="ink" onPress={() => Share.share({ message: `${event.title} · ${shortDate(event.date, event.time)} · ${event.location}` })} />
            </View>
          </View>
          <View style={{ gap: 10, marginTop: 60 }}>
            <View style={{ alignSelf: 'flex-start', backgroundColor: night.ink, paddingHorizontal: 10, paddingTop: 5, paddingBottom: 3, borderRadius: 8 }}>
              <T display size={16} color={brand.color}>{brand.name}</T>
            </View>
            <H1 size={64} color={event.image ? night.paper : night.ink}>{event.title}</H1>
          </View>
        </View>
      }
    >
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Card style={{ flex: 1, gap: 4 }} pad={14}>
          <T mono weight="700" size={11} color={night.muted}>WHEN</T>
          <T size={15} weight="600">{[shortDate(event.date, event.time), event.time].filter(Boolean).join(', ')}</T>
          <TextLink label="Add to calendar" size={13} onPress={() => addToCalendar(event)} />
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

      {!event.soldOut && !!event.tickets?.length && (
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <H2>Tickets</H2>
            <T size={12} color={night.muted}>Prices include fees + VAT</T>
          </View>
          {event.tickets.map((t) => {
            const qty = sel?.tier === t.tier ? sel.qty : 0;
            const soldOut = !t.available;
            return (
              <View key={t.tier} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, backgroundColor: night.card, borderWidth: qty ? 2 : 1.5, borderColor: qty ? night.ink : night.line, opacity: soldOut ? 0.55 : 1 }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <T size={16} weight="600" style={soldOut ? { textDecorationLine: 'line-through' } : undefined}>{t.tier}</T>
                  {!!t.description && <T size={13} color={night.muted}>{t.description}</T>}
                  <T mono weight="700" size={14} style={{ marginTop: 4 }}>{t.price === 0 ? 'Free' : rand(allIn(t.price))}</T>
                </View>
                {soldOut ? <Pill label="Sold out" /> : <Stepper value={qty} max={MAX_TICKETS_PER_PERSON} onChange={(n) => setSel(n ? { tier: t.tier, qty: n } : null)} />}
              </View>
            );
          })}
        </View>
      )}

      <Note icon="time-outline">
        <T size={14} lh={1.5} color={night.paper}>
          <T size={14} weight="700" color={night.paper}>We hold your tickets for {HOLD_HOURS} hours</T> while you pay by EFT. No card, no 3D Secure, no OTP drama.
        </T>
      </Note>

      {!!event.description && (
        <View style={{ gap: 6 }}>
          <H2>About</H2>
          <T size={15} lh={1.55} color={night.body}>{event.description}</T>
        </View>
      )}
    </Screen>
  );
}
