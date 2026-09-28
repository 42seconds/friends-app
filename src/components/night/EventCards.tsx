import { Image, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import T from './T';
import { Amp, DateBadge, EventRow, Pill } from './Display';
import { night } from '../../theme/night';
import { Event } from '../../types';
import { subBrandFor } from '../../lib/subbrands';
import { allIn, fromPrice, rand } from '../../lib/pricing';
import { shortDate } from '../../lib/dates';

export function isFree(e: Event) {
  return !e.tickets?.length || Math.min(...e.tickets.map((t) => t.price)) === 0;
}

export function priceLine(e: Event) {
  return isFree(e) ? 'Free · RSVP' : fromPrice(e.tickets);
}

// Where tapping an event should go: the waitlist once it's sold out.
export function eventHref(e: Event) {
  return e.soldOut ? `/waitlist/${e.id}` : `/event/${e.id}`;
}

// Big ink card with the coloured poster block (Explore's featured slot).
export function FeaturedEventCard({ event }: { event: Event }) {
  const router = useRouter();
  const brand = subBrandFor(event.tag);
  const min = event.tickets?.length ? Math.min(...event.tickets.map((t) => t.price)) : 0;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={event.title} onPress={() => router.push(eventHref(event) as any)} style={({ pressed }) => ({ borderRadius: 24, overflow: 'hidden', backgroundColor: night.ink, opacity: pressed ? 0.9 : 1 })}>
      <View style={{ height: 240, backgroundColor: brand.color, padding: 18, justifyContent: 'space-between', overflow: 'hidden' }}>
        {event.image ? <Image source={{ uri: event.image }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} /> : <Amp size={300} color={brand.deep} style={{ right: -30, top: -30 }} />}
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%', backgroundColor: 'rgba(21,19,15,0.55)' }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ backgroundColor: night.ink, paddingHorizontal: 10, paddingTop: 5, paddingBottom: 3, borderRadius: 8 }}>
            <T display size={16} color={brand.color}>{brand.name}</T>
          </View>
          <DateBadge date={event.date} time={event.time} large />
        </View>
        <T display size={58} lh={0.86} color={night.paper} numberOfLines={3}>{event.title}</T>
      </View>
      <View style={{ paddingVertical: 14, paddingHorizontal: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <T size={17} weight="600" color={night.paper}>
            {isFree(event) ? 'Free' : rand(allIn(min), true)} <T size={13} weight="500" color={night.inkMuted}>{isFree(event) ? 'RSVP' : 'all-in'}</T>
          </T>
          <T size={13} color={night.inkMuted} numberOfLines={1}>{[shortDate(event.date, event.time), event.location].filter(Boolean).join(' · ')}</T>
        </View>
        <View style={{ height: 44, paddingHorizontal: 16, borderRadius: 999, backgroundColor: event.soldOut ? night.blue : night.paper, justifyContent: 'center' }}>
          <T size={14} weight="600">{event.soldOut ? 'Join waitlist' : 'Get tickets'}</T>
        </View>
      </View>
    </Pressable>
  );
}

export function EventListRow({ event, sub, highlight }: { event: Event; sub?: string; highlight?: React.ReactNode }) {
  const router = useRouter();
  return (
    <EventRow
      title={event.title}
      subtitle={sub ?? priceLine(event)}
      image={event.image}
      tag={event.tag}
      date={event.date}
      time={event.time}
      highlight={highlight}
      onPress={() => router.push(eventHref(event) as any)}
      right={event.soldOut ? <Pill label="Waitlist" bg={night.ink} color={night.paper} /> : undefined}
    />
  );
}
