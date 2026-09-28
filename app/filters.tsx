import { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { H2, Sheet, SectionLabel, Chip, ChipRow, ListGroup, ToggleRow, PrimaryButton, OutlineButton, IconButton } from '../src/components/night';
import { useEvents } from '../src/hooks/useEvents';
import { filtersStore, DEFAULT_FILTERS, Filters, WhenFilter, SortBy } from '../src/store';
import { applyFilters } from '../src/lib/filters';
import { SUB_BRANDS } from '../src/lib/subbrands';

const WHEN: { key: WhenFilter; label: string }[] = [
  { key: 'any', label: 'Any time' },
  { key: 'tonight', label: 'Tonight' },
  { key: 'weekend', label: 'This weekend' },
  { key: 'week', label: 'Next 7 days' },
];
const PRICES: { v: number | null; label: string }[] = [
  { v: null, label: 'Any price' },
  { v: 100, label: 'Under R100' },
  { v: 200, label: 'Under R200' },
  { v: 500, label: 'Under R500' },
];
const SORT: { key: SortBy; label: string }[] = [
  { key: 'soonest', label: 'Soonest' },
  { key: 'price', label: 'Price: low to high' },
];

// Sheet: filters applied to Search. Changes apply on "Show N events".
export default function FiltersSheet() {
  const router = useRouter();
  const { upcoming } = useEvents();
  const [f, setF] = useState<Filters>(filtersStore.get());
  const set = (patch: Partial<Filters>) => setF((prev) => ({ ...prev, ...patch }));
  const count = applyFilters(upcoming, f).length;

  return (
    <Sheet
      footer={
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <OutlineButton label="Clear all" style={{ flex: 1 }} height={58} onPress={() => setF(DEFAULT_FILTERS)} />
          <PrimaryButton
            label={`Show ${count} event${count === 1 ? '' : 's'}`}
            arrow={false}
            center
            style={{ flex: 2 }}
            onPress={() => {
              filtersStore.set(f);
              router.back();
            }}
          />
        </View>
      }
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <H2 size={40}>Filters</H2>
        <IconButton icon="close" label="Close" onPress={() => router.back()} />
      </View>
      <SectionLabel>WHEN</SectionLabel>
      <ChipRow>
        {WHEN.map((w) => (
          <Chip key={w.key} label={w.label} active={f.when === w.key} onPress={() => set({ when: w.key })} />
        ))}
      </ChipRow>
      <SectionLabel>PRICE, ALL-IN</SectionLabel>
      <ChipRow>
        {PRICES.map((p) => (
          <Chip key={p.label} label={p.label} active={!f.freeOnly && f.maxPrice === p.v} onPress={() => set({ maxPrice: p.v, freeOnly: false })} />
        ))}
      </ChipRow>
      <ListGroup>
        <ToggleRow title="Free events only" value={f.freeOnly} onChange={(v) => set({ freeOnly: v })} />
      </ListGroup>
      <SectionLabel>SUB-BRAND</SectionLabel>
      <ChipRow>
        {SUB_BRANDS.map((b) => {
          const on = f.brands.includes(b.key);
          return <Chip key={b.key} label={b.name} dot={b.color} active={on} onPress={() => set({ brands: on ? f.brands.filter((x) => x !== b.key) : [...f.brands, b.key] })} />;
        })}
      </ChipRow>
      <SectionLabel>SORT BY</SectionLabel>
      <ChipRow>
        {SORT.map((s) => (
          <Chip key={s.key} label={s.label} active={f.sort === s.key} onPress={() => set({ sort: s.key })} />
        ))}
      </ChipRow>
    </Sheet>
  );
}
