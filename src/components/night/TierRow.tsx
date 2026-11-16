import { Pressable, View } from 'react-native';
import T from './T';
import { Stepper } from './Controls';
import { Pill } from './Display';
import { night } from '../../theme/night';
import { TicketTier } from '../../types';
import { allIn, rand } from '../../lib/pricing';
import { tierBadges, tierState } from '../../lib/tiers';

const TONES = {
  lime: { bg: night.lime, fg: night.ink },
  orange: { bg: night.orange, fg: night.ink },
  ink: { bg: night.ink, fg: night.paper },
  muted: { bg: night.sand, fg: night.body },
};

// One ticket type: name, price, labels (early bird, ends soon, only N
// left) and + / −. Sold out shows a way onto the waitlist; a finished
// early bird can't be picked.
export default function TierRow({ tier, qty, max, onChange, onWaitlist }: { tier: TicketTier; qty: number; max: number; onChange: (n: number) => void; onWaitlist?: () => void }) {
  const state = tierState(tier);
  const badges = tierBadges(tier);
  const open = state === 'on_sale';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, backgroundColor: night.card, borderWidth: qty ? 2 : 1.5, borderColor: qty ? night.ink : night.line, opacity: open ? 1 : 0.7 }}>
      <View style={{ flex: 1, gap: 3 }}>
        {badges.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 2 }}>
            {badges.map((b) => (
              <Pill key={b.label} label={b.label} bg={TONES[b.tone].bg} color={TONES[b.tone].fg} />
            ))}
          </View>
        )}
        <T size={16} weight="600" style={!open ? { textDecorationLine: 'line-through' } : undefined}>{tier.tier}</T>
        {!!tier.description && <T size={13} color={night.muted}>{tier.description}</T>}
        <T mono weight="700" size={14} style={{ marginTop: 2 }} color={open ? night.ink : night.muted}>{tier.price === 0 ? 'Free' : rand(allIn(tier.price))}</T>
      </View>
      {open ? (
        <Stepper value={qty} max={Math.max(qty, max)} onChange={onChange} />
      ) : state === 'sold_out' ? (
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <Pill label="Sold out" bg={night.ink} color={night.paper} />
          {onWaitlist && (
            <Pressable accessibilityRole="button" onPress={onWaitlist} hitSlop={8}>
              <T size={13} weight="700" style={{ textDecorationLine: 'underline' }}>Join waitlist</T>
            </Pressable>
          )}
        </View>
      ) : (
        <Pill label="Sales ended" />
      )}
    </View>
  );
}
