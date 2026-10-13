import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { T, Amp, Screen, PrimaryButton, OutlineButton } from '../../src/components/night';
import { logoutUser } from '../../src/services/authService';
import { useProfile } from '../../src/hooks/useProfile';
import { night } from '../../src/theme/night';
import { safeBack } from '../../src/lib/nav';

const SECONDS = 5;
const SIZE = 220, STROKE = 12, R = (SIZE - STROKE) / 2, C = 2 * Math.PI * R;

// Log out with a 5-second countdown, so a mis-tap can be undone.
// At zero (or on "Log out now") we sign out; the RedirectGate then
// takes the person back to the login screen.
export default function LogoutScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const [left, setLeft] = useState(SECONDS * 1000);
  const [leaving, setLeaving] = useState(false);
  const done = useRef(false);

  const leave = async () => {
    if (done.current) return;
    done.current = true;
    setLeaving(true);
    await logoutUser().catch(() => {});
  };

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => {
      const rest = Math.max(0, SECONDS * 1000 - (Date.now() - start));
      setLeft(rest);
      if (rest === 0) {
        clearInterval(id);
        leave();
      }
    }, 100);
    return () => clearInterval(id);
  }, []);

  const first = profile?.name?.split(' ')[0];
  const secs = Math.ceil(left / 1000);
  const progress = left / (SECONDS * 1000);

  return (
    <Screen bg={night.ink} dark fill contentStyle={{ justifyContent: 'center', alignItems: 'center', gap: 22 }}>
      <Amp size={420} color={night.ink2} style={{ right: -120, top: -40 }} />
      <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel={`Logging out in ${secs} seconds`} accessibilityLiveRegion="polite">
        <Svg width={SIZE} height={SIZE} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={night.ink2} strokeWidth={STROKE} fill="none" />
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={night.lime} strokeWidth={STROKE} fill="none" strokeLinecap="round" strokeDasharray={`${C} ${C}`} strokeDashoffset={C * (1 - progress)} />
        </Svg>
        <T display size={120} color={night.paper} style={{ lineHeight: 120, marginTop: 8 }}>{leaving ? '0' : secs}</T>
      </View>

      <View style={{ alignItems: 'center', gap: 8 }}>
        <T display size={52} color={night.paper} center>{leaving ? 'See you soon' : 'Logging you out'}</T>
        <T size={15} lh={1.5} color={night.inkMuted} center style={{ maxWidth: 290 }}>
          {first ? `${first}, your` : 'Your'} tickets, saves and plans stay on your account. Log back in any time to see them.
        </T>
      </View>

      <View style={{ alignSelf: 'stretch', gap: 10, marginTop: 10 }}>
        <PrimaryButton tone="lime" label="Log out now" onPress={leave} loading={leaving} />
        <OutlineButton dark label="Cancel, keep me logged in" disabled={leaving} onPress={() => safeBack(router, '/settings')} />
      </View>
    </Screen>
  );
}
