import { ReactNode, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import T from './T';
import { coachStore, dismissCoach } from '../../store';
import { night } from '../../theme/night';

function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}

interface CoachProps {
  id: string; // remembered once dismissed, so it shows on the first visit only
  text: ReactNode;
  children: ReactNode;
  placement?: 'below' | 'above';
  number?: number; // badge when one screen points at several things
  after?: string; // only show once this other bubble was dismissed
  radius?: number; // the target's corner radius, for the ring
  show?: boolean;
  style?: StyleProp<ViewStyle>;
  tailAlign?: 'left' | 'center' | 'right';
}

// A first-visit bubble pointing at the thing to tap: an ink speech bubble
// with a tail, a pulsing lime ring around the target and a "Got it".
// Tapping the bubble also dismisses it. Reduce motion: fade only.
export function CoachMark({ id, text, children, placement = 'below', number, after, radius = 18, show = true, style, tailAlign = 'left' }: CoachProps) {
  const { seen } = coachStore.useStore();
  const visible = show && !seen.includes(id) && (!after || seen.includes(after));
  const reduce = useReduceMotion();
  const pop = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    pop.setValue(0);
    Animated.timing(pop, { toValue: 1, duration: 260, delay: 300, useNativeDriver: true }).start();
    if (reduce) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [visible, reduce]);

  if (!visible) return <View style={style}>{children}</View>;

  const tailSide = tailAlign === 'left' ? { left: 28 } : tailAlign === 'right' ? { right: 28 } : { left: '50%' as const, marginLeft: -7 };
  const bubble = (
    <Animated.View style={{ opacity: pop, transform: reduce ? [] : [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }], alignSelf: tailAlign === 'right' ? 'flex-end' : tailAlign === 'center' ? 'center' : 'flex-start', maxWidth: 300, marginTop: placement === 'below' ? 12 : 0, marginBottom: placement === 'above' ? 12 : 0 }}>
      <View style={{ position: 'absolute', width: 14, height: 14, backgroundColor: night.ink, transform: [{ rotate: '45deg' }], ...(placement === 'below' ? { top: -6 } : { bottom: -6 }), ...tailSide }} />
      <Pressable accessibilityRole="button" accessibilityLabel={`Tip: ${typeof text === 'string' ? text : ''}. Double tap to dismiss`} onPress={() => dismissCoach(id)} style={{ backgroundColor: night.ink, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, gap: 6, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 }}>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
          {number !== undefined && (
            <View style={{ width: 22, height: 22, borderRadius: 99, backgroundColor: night.lime, alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
              <T mono weight="700" size={11}>{number}</T>
            </View>
          )}
          <T size={14} lh={1.4} color={night.paper} style={{ flexShrink: 1 }}>{text}</T>
        </View>
        <T size={13} weight="700" color={night.lime} style={{ alignSelf: 'flex-end' }}>Got it</T>
      </Pressable>
    </Animated.View>
  );

  return (
    <View style={style}>
      {placement === 'above' && bubble}
      <View>
        {children}
        <Animated.View pointerEvents="none" style={{ position: 'absolute', top: -4, left: -4, right: -4, bottom: -4, borderRadius: radius + 4, borderWidth: 3, borderColor: night.lime, opacity: reduce ? 1 : pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.35] }) }} />
      </View>
      {placement === 'below' && bubble}
    </View>
  );
}

const STEPS = ['Pick', 'Reserve', 'Pay', 'Upload', 'Checked'];

// "Your first ticket" step tracker, shown on each screen of the first
// booking until the first ticket is confirmed or the person hides it.
export function FirstTicketTracker({ step }: { step: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <View style={{ backgroundColor: night.ink, borderRadius: 18, padding: 14, gap: 10, borderWidth: 1, borderColor: night.ink2 }} accessibilityLabel={`Your first ticket, step ${step} of 5: ${STEPS[step - 1]}`}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 24, height: 24, borderRadius: 7, backgroundColor: night.orange, alignItems: 'center', justifyContent: 'center' }}>
          <T display size={17} style={{ marginTop: 2 }}>&amp;</T>
        </View>
        <T size={14} weight="700" color={night.paper} style={{ flex: 1 }}>Your first ticket</T>
        <T mono weight="700" size={11} color={night.inkMuted}>STEP {step} OF 5</T>
      </View>
      <View style={{ flexDirection: 'row', gap: 5 }}>
        {STEPS.map((n, i) => {
          const done = i + 1 < step, now = i + 1 === step;
          return (
            <View key={n} style={{ flex: 1, gap: 5 }}>
              <View style={{ height: 4, borderRadius: 99, backgroundColor: done ? night.lime : now ? night.orange : night.darkLine }} />
              <T size={11} weight={now ? '700' : '500'} color={done || now ? night.paper : night.navInactive} numberOfLines={1}>{done ? `✓ ${n}` : n}</T>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function HideGuideLink({ dark }: { dark?: boolean }) {
  return (
    <Pressable accessibilityRole="button" hitSlop={8} onPress={() => coachStore.set({ guideHidden: true })}>
      <T size={13} weight="600" color={dark ? night.inkMuted : night.muted} style={{ textDecorationLine: 'underline' }}>Hide guide</T>
    </Pressable>
  );
}

// Explore: the card that starts the first-ticket guide.
export function FirstTicketIntro() {
  const router = useRouter();
  return (
    <View style={{ backgroundColor: night.ink, borderRadius: 22, padding: 18, gap: 12, overflow: 'hidden' }}>
      <T display size={180} color={night.ink2} style={{ position: 'absolute', right: -14, top: -40 }}>&amp;</T>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <T display size={36} lh={0.95} color={night.paper} style={{ flex: 1 }}>Get your first{'\n'}ticket in 5 steps</T>
        <HideGuideLink dark />
      </View>
      <T size={13} lh={1.45} color={night.inkMuted}>We'll point at each tap. Takes about 3 minutes, plus your bank transfer.</T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {STEPS.map((n, i) => (
          <View key={n} style={{ paddingHorizontal: 10, height: 28, borderRadius: 99, justifyContent: 'center', backgroundColor: i === 0 ? night.orange : night.ink2 }}>
            <T size={12} weight="700" color={i === 0 ? night.ink : night.paper}>{i + 1} {n}</T>
          </View>
        ))}
      </View>
      <Pressable accessibilityRole="link" onPress={() => router.push('/guide?replay=1')}>
        <T size={13} weight="600" color={night.lime} style={{ textDecorationLine: 'underline' }}>Watch the 1-minute guide</T>
      </Pressable>
    </View>
  );
}
