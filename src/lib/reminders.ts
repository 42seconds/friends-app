// When the pay-later reminders fire, for a hold that ends at `holdEnd`.
export const REMINDERS = [
  { key: 'in2h', title: 'In 2 hours', sub: 'Push notification', at: (now: number, _end: number) => now + 2 * 3600_000 },
  { key: 'before6h', title: '6 hours before the hold ends', sub: 'Push notification', at: (_now: number, end: number) => end - 6 * 3600_000 },
  { key: 'before1h', title: '1 hour before', sub: 'Last call', at: (_now: number, end: number) => end - 3600_000 },
] as const;

export type ReminderKey = (typeof REMINDERS)[number]['key'];

// Only reminders still in the future and before the hold ends.
export function reminderTimes(keys: ReminderKey[], now: number, holdEnd: number) {
  return REMINDERS.filter((r) => keys.includes(r.key))
    .map((r) => ({ key: r.key, at: r.at(now, holdEnd) }))
    .filter((r) => Number.isFinite(r.at) && r.at > now && r.at < holdEnd);
}
