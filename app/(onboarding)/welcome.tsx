import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { T, H1, Amp, PageDots, NextPill, TextLink } from '../../src/components/night';
import { useOnboarding } from '../../src/context/OnboardingContext';
import { night } from '../../src/theme/night';

// Onboarding 1 of 3: "Your night starts here".
export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { markOnboardingSeen } = useOnboarding();

  const skip = async () => {
    await markOnboardingSeen();
    router.replace('/(auth)/login');
  };

  return (
    <View style={{ flex: 1, backgroundColor: night.ink, paddingTop: insets.top + 12 }}>
      <StatusBar style="light" />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 30, height: 30, borderRadius: 99, backgroundColor: night.orange, alignItems: 'center', justifyContent: 'center' }}>
            <T display size={20}>&amp;</T>
          </View>
          <T size={14} weight="600" color={night.paper}>&amp;friends</T>
        </View>
        <TextLink label="Skip" onPress={skip} color={night.inkMuted} />
      </View>

      {/* Stack of three tickets */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={{ position: 'absolute', width: 230, height: 350, borderRadius: 26, backgroundColor: night.blue, transform: [{ rotate: '-12deg' }, { translateX: -40 }] }} />
        <View style={{ position: 'absolute', width: 230, height: 350, borderRadius: 26, backgroundColor: night.lime, transform: [{ rotate: '9deg' }, { translateX: 40 }] }} />
        <View style={{ width: 242, height: 370, borderRadius: 26, backgroundColor: night.orange, overflow: 'hidden', transform: [{ rotate: '-2deg' }], shadowColor: '#000', shadowOpacity: 0.45, shadowRadius: 30, shadowOffset: { width: 0, height: 20 }, elevation: 12 }}>
          <View style={{ padding: 20, paddingBottom: 0, flexDirection: 'row', justifyContent: 'space-between' }}>
            <T mono weight="700" size={11}>ADMIT ONE</T>
            <T mono weight="700" size={11}>NO. 0001</T>
          </View>
          <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 10 }}>
            <Amp size={250} color={night.orangeDeep} style={{ right: -30, bottom: -60 }} />
            <T display size={66} lh={0.86}>You,{'\n'}this{'\n'}weekend</T>
          </View>
          <View style={{ height: 22, justifyContent: 'center' }}>
            <View style={{ position: 'absolute', left: -11, width: 22, height: 22, borderRadius: 99, backgroundColor: night.ink }} />
            <View style={{ marginHorizontal: 18, borderTopWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(21,19,15,0.45)' }} />
            <View style={{ position: 'absolute', right: -11, width: 22, height: 22, borderRadius: 99, backgroundColor: night.ink }} />
          </View>
          <View style={{ flexDirection: 'row', padding: 20, paddingTop: 10, gap: 8 }}>
            <View style={{ flex: 1 }}>
              <T mono weight="700" size={10}>WHERE</T>
              <T size={14} weight="600">Braamfontein</T>
            </View>
            <View style={{ flex: 1 }}>
              <T mono weight="700" size={10}>WITH</T>
              <T size={14} weight="600">Your people</T>
            </View>
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 28, gap: 10 }}>
        <H1 size={54} color={night.paper}>Your night{'\n'}starts here</H1>
        <T size={16} lh={1.5} color={night.inkMuted}>Talks, parties, gigs and markets in Braam. One app for finding them, booking them and getting in.</T>
        <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <PageDots index={0} />
          <NextPill onPress={() => router.push('/(onboarding)/brands')} />
        </View>
      </View>
    </View>
  );
}
