import { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T, H2, Screen, IconButton, Chip, ChipRow, SectionLabel, EventListRow, EmptyState, TextLink, Pill } from '../src/components/night';
import { useEvents } from '../src/hooks/useEvents';
import { filtersStore, recentSearchStore, pushRecentSearch, DEFAULT_FILTERS } from '../src/store';
import { subBrandFor, SUB_BRANDS } from '../src/lib/subbrands';
import { applyFilters, activeFilterLabels, minPrice } from '../src/lib/filters';
import { fonts, night } from '../src/theme/night';
import { safeBack } from '../src/lib/nav';

// Highlights the matched part of a title.
function Highlight({ text, q }: { text: string; q: string }) {
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (!q || i < 0) return <T size={16} weight="600" numberOfLines={2}>{text}</T>;
  return (
    <T size={16} weight="600" numberOfLines={2}>
      {text.slice(0, i)}
      <T size={16} weight="700" style={{ backgroundColor: night.amberBg }}>{text.slice(i, i + q.length)}</T>
      {text.slice(i + q.length)}
    </T>
  );
}

export default function SearchScreen() {
  const router = useRouter();
  const { upcoming } = useEvents();
  const filters = filtersStore.useStore();
  const { terms } = recentSearchStore.useStore();
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();

  const filtered = useMemo(() => applyFilters(upcoming, filters), [upcoming, filters]);
  const events = filtered.filter((e) => !query || [e.title, e.location, e.tag, e.description].some((s) => s?.toLowerCase().includes(query)));
  const venues = Array.from(new Set(upcoming.map((e) => e.location).filter(Boolean))).filter((v) => query && v.toLowerCase().includes(query));
  const active = activeFilterLabels(filters);

  return (
    <Screen
      header={
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <IconButton icon="arrow-back" label="Back" onPress={() => safeBack(router)} />
            <View style={{ flex: 1, height: 48, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: night.card, borderWidth: 2, borderColor: night.ink }}>
              <Ionicons name="search" size={18} color={night.ink} />
              <TextInput
                accessibilityLabel="Search events and venues"
                autoFocus
                value={q}
                onChangeText={setQ}
                onSubmitEditing={() => pushRecentSearch(q)}
                returnKeyType="search"
                placeholder="Events, venues, vibes"
                placeholderTextColor={night.faint}
                style={{ flex: 1, fontFamily: fonts.regular, fontSize: 16, color: night.ink }}
              />
              {!!q && (
                <Pressable accessibilityLabel="Clear search" onPress={() => setQ('')} style={{ width: 26, height: 26, borderRadius: 99, backgroundColor: night.sand, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="close" size={14} color={night.ink} />
                </Pressable>
              )}
            </View>
            <View>
              <IconButton icon="options-outline" label="Filters" tone="ink" onPress={() => router.push('/filters')} />
              {active.length > 0 && (
                <View style={{ position: 'absolute', top: -4, right: -4, minWidth: 20, height: 20, borderRadius: 99, backgroundColor: night.orange, alignItems: 'center', justifyContent: 'center' }}>
                  <T size={11} weight="700">{active.length}</T>
                </View>
              )}
            </View>
          </View>
      }
    >

      {!query && terms.length > 0 && (
        <View style={{ gap: 8 }}>
          <SectionLabel right={<TextLink label="Clear" size={12} onPress={() => recentSearchStore.set({ terms: [] })} />}>RECENT</SectionLabel>
          <ChipRow>
            {terms.map((t) => (
              <Chip key={t} label={t} icon="time-outline" onPress={() => setQ(t)} />
            ))}
          </ChipRow>
        </View>
      )}

      {active.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, padding: 12, borderRadius: 16, backgroundColor: night.ink }}>
          <T size={13} color={night.inkMuted}>Filters on:</T>
          {active.map((l) => (
            <Pill key={l} label={l} bg={night.ink2} color={night.paper} />
          ))}
          <View style={{ flex: 1 }} />
          <TextLink label="Clear" size={12} color={night.paper} onPress={() => filtersStore.set(DEFAULT_FILTERS)} />
        </View>
      )}

      {events.length === 0 && venues.length === 0 ? (
        <EmptyState icon="search-outline" title="No matches" body={query ? `Nothing for "${q.trim()}" right now. Try a sub-brand instead.` : 'Nothing matches those filters.'}>
          <ChipRow>
            {SUB_BRANDS.map((b) => (
              <Chip key={b.key} label={b.name} dot={b.color} onPress={() => router.push(`/brand/${b.key}`)} />
            ))}
          </ChipRow>
          {active.length > 0 && <TextLink label="Clear filters and try again" onPress={() => filtersStore.set(DEFAULT_FILTERS)} />}
        </EmptyState>
      ) : (
        <>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <H2>Events</H2>
            <T mono weight="700" size={11} color={night.muted}>{events.length} RESULT{events.length === 1 ? '' : 'S'}</T>
          </View>
          <View style={{ gap: 10 }}>
            {events.map((e) => (
              <EventListRow key={e.id} event={e} sub={`${subBrandFor(e.tag).name} · ${e.soldOut ? 'Sold out' : minPrice(e) ? `R${Math.round(minPrice(e))} all-in` : 'Free'}`} highlight={<Highlight text={e.title} q={query} />} />
            ))}
          </View>
          {venues.length > 0 && (
            <>
              <H2>Venues</H2>
              {venues.map((v) => (
                <Pressable key={v} onPress={() => router.push(`/venue/${encodeURIComponent(v)}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 10, borderRadius: 18, backgroundColor: night.card, borderWidth: 1.5, borderColor: night.line }}>
                  <View style={{ width: 64, height: 64, borderRadius: 14, backgroundColor: night.ink, alignItems: 'center', justifyContent: 'center' }}>
                    <T display size={40} color={night.orange}>&amp;</T>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Highlight text={v} q={query} />
                    <T size={13} color={night.muted}>{upcoming.filter((e) => e.location === v).length} upcoming</T>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={night.muted} />
                </Pressable>
              ))}
            </>
          )}
        </>
      )}
    </Screen>
  );
}
