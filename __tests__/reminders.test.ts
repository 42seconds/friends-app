import { reminderTimes } from '../src/lib/reminders';

const H = 3600_000;

describe('pay-later reminders', () => {
  it('schedules the chosen reminders inside the hold', () => {
    const now = 0, end = 24 * H;
    expect(reminderTimes(['in2h', 'before6h', 'before1h'], now, end)).toEqual([
      { key: 'in2h', at: 2 * H },
      { key: 'before6h', at: 18 * H },
      { key: 'before1h', at: 23 * H },
    ]);
  });

  it('drops reminders that would be in the past or after the hold', () => {
    expect(reminderTimes(['in2h', 'before6h', 'before1h'], 0, 3 * H)).toEqual([{ key: 'in2h', at: 2 * H }, { key: 'before1h', at: 2 * H }]);
    expect(reminderTimes(['before1h'], 0, 30 * 60_000)).toEqual([]);
    // No hold end known: only the "in 2 hours" one makes sense.
    expect(reminderTimes(['in2h', 'before1h'], 0, Infinity)).toEqual([{ key: 'in2h', at: 2 * H }]);
  });
});
