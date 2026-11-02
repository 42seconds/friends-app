// Access codes the team hands out: a % discount, or free "comp" tickets
// (guests of artists, sponsors, press, giveaways). Stored at
// promoCodes/{CODE}. Pure helpers here so they can be tested.

export type CodeType = 'percent' | 'comp';

export interface AccessCode {
  code: string;
  type: CodeType;
  percentOff: number; // 100 for comp
  label?: string; // who it's for, e.g. "Wits students", "Press"
  eventId?: string; // only valid for this event
  maxUses?: number; // bookings it can be used for
  uses: number;
  expiresAt?: string; // ISO
  active: boolean;
  createdAt?: string;
}

// No 0/O or 1/I/L, so codes read out loud or typed from a poster work.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateCode(type: CodeType, percentOff: number, rand: () => number = Math.random) {
  const prefix = type === 'comp' ? 'COMP' : `SAVE${percentOff}`;
  let tail = '';
  for (let i = 0; i < 6; i++) tail += ALPHABET[Math.floor(rand() * ALPHABET.length)];
  return `${prefix}-${tail}`;
}

export function cleanCode(code: string) {
  return code.trim().toUpperCase();
}

// Codes are letters, digits, - and _ only (a "/" would break the
// document path).
export function isWellFormed(code: string) {
  return /^[A-Z0-9_-]{1,30}$/.test(cleanCode(code));
}

// Turns a stored document into an AccessCode (older codes only had
// percentOff and active).
export function toAccessCode(code: string, d: Record<string, any>): AccessCode {
  const type: CodeType = d.type === 'comp' ? 'comp' : 'percent';
  return {
    code,
    type,
    percentOff: type === 'comp' ? 100 : Number(d.percentOff ?? 0),
    label: d.label || undefined,
    eventId: d.eventId || undefined,
    maxUses: typeof d.maxUses === 'number' ? d.maxUses : undefined,
    uses: Number(d.uses ?? 0),
    expiresAt: d.expiresAt || undefined,
    active: d.active !== false,
    createdAt: d.createdAt,
  };
}

// Why a code can't be used for this event right now, or null if it can.
export function codeProblem(c: AccessCode, eventId: string, now = Date.now()): string | null {
  if (!c.active) return 'That code has been switched off.';
  if (c.eventId && c.eventId !== eventId) return "That code isn't for this event.";
  if (c.expiresAt && Date.parse(c.expiresAt) < now) return 'That code has expired.';
  if (c.maxUses !== undefined && c.uses >= c.maxUses) return 'That code has been fully used.';
  return null;
}

export function describeCode(c: Pick<AccessCode, 'type' | 'percentOff'>) {
  return c.type === 'comp' ? 'Free tickets (comp)' : `${c.percentOff}% off face value`;
}
