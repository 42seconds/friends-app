import { createPersistedStore } from './persisted';
import { SubBrandKey } from '../lib/subbrands';

// Events the user hearted, newest first.
export const savedStore = createPersistedStore('nightSaved', { ids: [] as string[] });

export function toggleSaved(eventId: string) {
  savedStore.set((s) => ({
    ids: s.ids.includes(eventId) ? s.ids.filter((id) => id !== eventId) : [eventId, ...s.ids],
  }));
}

export const recentSearchStore = createPersistedStore('nightRecentSearches', { terms: [] as string[] });

export function pushRecentSearch(term: string) {
  const t = term.trim();
  if (!t) return;
  recentSearchStore.set((s) => ({ terms: [t, ...s.terms.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 6) }));
}

export interface Prefs {
  push: boolean;
  whatsapp: boolean;
  email: boolean;
  waitlistOffers: boolean;
  eventReminders: boolean;
  setTimes: boolean;
  friends: boolean;
  newEvents: boolean;
  quietHours: boolean;
  showInFriendsGoing: boolean;
  language: string;
  followedBrands: SubBrandKey[];
  followedVenues: string[];
  lineupReminders: string[]; // `${eventId}:${slotIndex}`
}

export const prefsStore = createPersistedStore<Prefs>('nightPrefs', {
  push: true,
  whatsapp: true,
  email: false,
  waitlistOffers: true,
  eventReminders: true,
  setTimes: true,
  friends: true,
  newEvents: false,
  quietHours: true,
  showInFriendsGoing: true,
  language: 'en',
  followedBrands: [],
  followedVenues: [],
  lineupReminders: [],
});

export type WhenFilter = 'any' | 'tonight' | 'weekend' | 'week';
export type SortBy = 'soonest' | 'price' | 'friends';

export interface Filters {
  when: WhenFilter;
  maxPrice: number | null; // all-in rand, null = no cap
  freeOnly: boolean;
  brands: SubBrandKey[];
  sort: SortBy;
}

export const DEFAULT_FILTERS: Filters = { when: 'any', maxPrice: null, freeOnly: false, brands: [], sort: 'soonest' };

// Not persisted on purpose: filters reset each app launch.
export const filtersStore = createPersistedStore<Filters>(null, DEFAULT_FILTERS);

export interface StaffSetup {
  eventId: string | null;
  door: string;
}

export const staffStore = createPersistedStore<StaffSetup>('nightStaff', { eventId: null, door: 'Door A' });

// Promo code applied on the Review booking screen (set by the promo sheet).
export const promoStore = createPersistedStore<{ eventId: string | null; code: string; percentOff: number }>(null, { eventId: null, code: '', percentOff: 0 });
