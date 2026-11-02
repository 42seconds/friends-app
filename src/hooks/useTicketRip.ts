import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'nightRipped:';

export type RipPhase = 'whole' | 'ripping' | 'ripped';

// The ticket stub tears off once the ticket is scanned at the door. It
// plays once per ticket on this phone (live, if the screen is open while
// the door scans it); after that the ticket shows as already torn.
export function useTicketRip(ticketId: string | undefined, checkedIn: boolean) {
  const [phase, setPhase] = useState<RipPhase>('whole');
  const progress = useRef(new Animated.Value(0)).current;
  const wiggle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!ticketId || !checkedIn) {
      setPhase('whole');
      progress.setValue(0);
      return;
    }
    let cancelled = false;
    (async () => {
      const seen = await AsyncStorage.getItem(KEY + ticketId).catch(() => null);
      if (cancelled) return;
      if (seen) {
        progress.setValue(1);
        setPhase('ripped');
        return;
      }
      const reduce = await AccessibilityInfo.isReduceMotionEnabled().catch(() => false);
      if (cancelled) return;
      setPhase('ripping');
      const tear = Animated.timing(progress, { toValue: 1, duration: reduce ? 500 : 1100, easing: Easing.in(Easing.cubic), useNativeDriver: true });
      const shake = Animated.sequence([
        Animated.timing(wiggle, { toValue: 1, duration: 70, useNativeDriver: true }),
        Animated.timing(wiggle, { toValue: -1, duration: 90, useNativeDriver: true }),
        Animated.timing(wiggle, { toValue: 1, duration: 90, useNativeDriver: true }),
        Animated.timing(wiggle, { toValue: 0, duration: 70, useNativeDriver: true }),
      ]);
      Animated.sequence([Animated.delay(600), ...(reduce ? [] : [shake]), tear]).start(() => {
        if (cancelled) return;
        setPhase('ripped');
        AsyncStorage.setItem(KEY + ticketId, '1').catch(() => {});
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [ticketId, checkedIn]);

  // The stub peels away from its top-left corner, drops and fades.
  const stubStyle = {
    transformOrigin: 'left top' as const,
    opacity: progress.interpolate({ inputRange: [0, 0.75, 1], outputRange: [1, 1, 0] }),
    transform: [
      { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 340] }) },
      { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 40] }) },
      { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '16deg'] }) },
      { rotate: wiggle.interpolate({ inputRange: [-1, 1], outputRange: ['-1.5deg', '1.5deg'] }) },
    ],
  };
  // The "Admitted" stamp lands as the stub goes.
  const stampStyle = {
    opacity: progress.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 0, 1] }),
    transform: [{ scale: progress.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1.6, 1.6, 1] }) }, { rotate: '-4deg' }],
  };
  return { phase, stubStyle, stampStyle };
}
