import { ReactNode } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { T, H1, Screen, TopBar, PageDots, PrimaryButton, TextLink } from '../../src/components/night';
import { useOnboarding } from '../../src/context/OnboardingContext';
import { useAuth } from '../../src/context/AuthContext';
import { HOLD_HOURS } from '../../src/config/pricing';
import { night } from '../../src/theme/night';

function Step({ n, color, fg = night.ink, title, body, last, children, side }: { n: number; color: string; fg?: string; title: string; body: string; last?: boolean; children?: ReactNode; side?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', gap: 14 }}>
      <View style={{ width: 44, alignItems: 'center' }}>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
          <T display size={28} color={fg}>{n}</T>
        </View>
        {!last && <View style={{ width: 2, flex: 1, backgroundColor: night.ink }} />}
      </View>
      <View style={{ flex: 1, flexDirection: 'row', gap: 12, alignItems: 'center', paddingTop: 4, paddingBottom: last ? 0 : 18 }}>
        <View style={{ flex: 1, gap: 6 }}>
          <T display size={28} lh={1}>{title}</T>
          <T size={14} lh={1.45} color={night.body}>{body}</T>
          {children}
        </View>
        {side}
      </View>
    </View>
  );
}

// Onboarding 3 of 3: how booking works, then sign up / log in / browse.
export default function HowScreen() {
  const router = useRouter();
  const { markOnboardingSeen } = useOnboarding();
  const { setBrowsing } = useAuth();

  const go = async (to: '/(auth)/register' | '/(auth)/login') => {
    await markOnboardingSeen();
    router.replace(to);
  };

  const browse = async () => {
    setBrowsing(true);
    await markOnboardingSeen();
    router.replace('/(tabs)/home');
  };

  return (
    <Screen
      footer={
        <>
          <PrimaryButton label="Create my account" onPress={() => go('/(auth)/register')} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TextLink label="I already have an account" onPress={() => go('/(auth)/login')} />
            <TextLink label="Just browsing for now" muted onPress={browse} />
          </View>
        </>
      }
    >
      <TopBar center={<PageDots index={2} dark={false} />} />
      <H1 size={62}>Tap, pay,{'\n'}walk right in</H1>
      <View>
        <Step n={1} color={night.ink} fg={night.orange} title="Reserve" body={`Pick your tickets. We hold them for you for ${HOLD_HOURS} hours. The price you see already includes fees.`} />
        <Step n={2} color={night.ink} fg={night.yellow} title="Pay by EFT" body="Copy our details into your banking app, then upload your proof. No card needed.">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, paddingHorizontal: 10, borderRadius: 12, backgroundColor: night.cream, borderWidth: 1.5, borderColor: '#F0DFA0' }}>
            <T size={12} weight="700" color="#6B4A00">REF</T>
            <T mono weight="700" size={13} style={{ flex: 1 }}>TKT-XXXXXXXX</T>
            <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99, backgroundColor: night.ink }}>
              <T size={12} weight="700" color={night.paper}>Tap to copy</T>
            </View>
          </View>
        </Step>
        <Step
          n={3}
          color={night.orange}
          title="Show your QR"
          body="Once we've checked your payment, your ticket unlocks. It works offline at the door."
          last
          side={
            <View style={{ width: 70, height: 70, borderRadius: 12, backgroundColor: night.ink, padding: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 2, transform: [{ rotate: '6deg' }] }}>
              {'1101110101010101101110110'.split('').map((c, i) => (
                <View key={i} style={{ width: 8.4, height: 8.4, backgroundColor: c === '1' ? (i === 12 ? night.orange : night.paper) : 'transparent' }} />
              ))}
            </View>
          }
        />
      </View>
    </Screen>
  );
}
