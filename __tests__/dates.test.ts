import { parseEventDate, shortDate, isPast, relativeDay, countdown } from '../src/lib/dates';

describe('event dates', () => {
  it('parses the date format the website saves', () => {
    const d = parseEventDate('Tue, 24 November 2026', '19:30');
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2026);
    expect(d!.getMonth()).toBe(10);
    expect(d!.getDate()).toBe(24);
  });

  it('ignores time ranges it cannot parse and still reads the date', () => {
    expect(parseEventDate('Tue, 24 November 2026', '19:30 - 22:00')).not.toBeNull();
  });

  it('returns null for missing or unreadable dates', () => {
    expect(parseEventDate(undefined)).toBeNull();
    expect(parseEventDate('sometime soon')).toBeNull();
  });

  it('shortens dates for cards and falls back to the raw text', () => {
    expect(shortDate('Tue, 24 November 2026')).toBe('Tue 24 Nov');
    expect(shortDate('TBC')).toBe('TBC');
  });

  it('treats unreadable dates as upcoming', () => {
    expect(isPast('TBC')).toBe(false);
    expect(isPast('Mon, 1 January 2001')).toBe(true);
  });

  it('labels today and tomorrow', () => {
    const today = new Date();
    const tomorrow = new Date(Date.now() + 86400000);
    expect(relativeDay(today.toDateString())).toBe('Tonight');
    expect(relativeDay(tomorrow.toDateString())).toBe('Tomorrow');
    expect(relativeDay('Mon, 1 January 2001')).toBeNull();
  });
});

describe('countdown', () => {
  it('formats the time left as hh:mm:ss', () => {
    expect(countdown(3_661_000, 0)).toBe('01:01:01');
  });

  it('never goes negative', () => {
    expect(countdown(0, 5000)).toBe('00:00:00');
  });

  it('shows dashes when there is no deadline', () => {
    expect(countdown(Infinity)).toBe('--:--:--');
  });
});
