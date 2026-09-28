import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { T, H1, IconButton, PageDots, NextPill, BrandTile } from '../../src/components/night';
import { useOnboarding } from '../../src/context/OnboardingContext';
import { SUB_BRANDS } from '../../src/lib/subbrands';
import { night } from '../../src/theme/night';

// Onboarding 2 of 3: the four sub-brands.
export default function BrandsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { markOnboardingSeen } = useOnboarding();
  const [talk, fun, music, food] = [SUB_BRANDS[1], SUB_BRANDS[2], SUB_BRANDS[0], SUB_BRANDS[3]];

  const skip = async () => {
    await markOnboardingSeen();
    router.replace('/(auth)/login');
  };

  return (
    <View style={{ flex: 1, backgroundColor: night.ink, paddingTop: insets.top + 12 }}>
      <StatusBar style="light" />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 }}>
        <IconButton icon="arrow-back" label="Back" tone="dark" onPress={() => router.back()} />
        <IconButton label="Skip" tone="dark" onPress={skip}>
          <T size={14} weight="600" color={night.paper}>Skip</T>
        </IconButton>
      </View>
      <View style={{ paddingHorizontal: 20, paddingTop: 22 }}>
        <H1 size={62} color={night.paper}>Four ways{'\n'}to show up</H1>
      </View>
      <View style={{ paddingHorizontal: 20, paddingTop: 20, gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <BrandTile brand={talk} style={{ flex: 1, transform: [{ rotate: '-1.5deg' }] }} />
          <BrandTile brand={fun} style={{ flex: 1, transform: [{ rotate: '1.5deg' }, { translateY: 10 }] }} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <BrandTile brand={music} style={{ flex: 1, transform: [{ rotate: '1deg' }] }} />
          <BrandTile brand={food} style={{ flex: 1, transform: [{ rotate: '-1deg' }, { translateY: 10 }] }} />
        </View>
      </View>
      <View style={{ marginTop: 'auto', paddingHorizontal: 24, paddingBottom: insets.bottom + 28, gap: 18 }}>
        <T size={15} lh={1.5} color={night.inkMuted}>You'll pick your favourites when you sign up, so your feed starts with what you're into.</T>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <PageDots index={1} />
          <NextPill onPress={() => router.push('/(onboarding)/how')} />
        </View>
      </View>
    </View>
  );
}
