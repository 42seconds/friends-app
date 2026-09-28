import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import {
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
  InstrumentSans_700Bold,
} from '@expo-google-fonts/instrument-sans';
import { JetBrainsMono_500Medium, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { OnboardingProvider, useOnboarding } from '../src/context/OnboardingContext';
import Splash from '../src/components/night/Splash';
import { night } from '../src/theme/night';

// Routes a logged-out visitor may open while "just browsing".
const BROWSABLE = new Set(['(tabs)', 'event', 'search', 'filters', 'brand', 'venue', 'past', 'offline']);

// Info pages anyone can read, logged in or not (linked from sign-up).
const PUBLIC = new Set(['settings/legal', 'settings/help', 'settings/about', 'settings/venue-info']);

// Routes presented as bottom sheets (transparent modals that draw their own backdrop).
const SHEETS = ['filters', 'purchase/tickets', 'purchase/promo', 'waitlist/join', 'ticket/send', 'staff/reject'];

function RedirectGate() {
  const { user, loading: authLoading, browsing } = useAuth();
  const { hasSeenOnboarding } = useOnboarding();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (authLoading || hasSeenOnboarding === null) return;

    const group = segments[0] as string | undefined;
    const inOnboardingGroup = group === '(onboarding)';
    const inAuthGroup = group === '(auth)';
    if (PUBLIC.has(segments.join('/'))) return;

    if (!hasSeenOnboarding && !inOnboardingGroup && !inAuthGroup && !browsing) {
      router.replace('/(onboarding)/welcome');
    } else if (!user && !inAuthGroup && !inOnboardingGroup && !(browsing && group && BROWSABLE.has(group))) {
      router.replace(browsing ? '/(tabs)/home' : '/(auth)/login');
    } else if (user && (inAuthGroup || inOnboardingGroup)) {
      router.replace('/(tabs)/home');
    }
  }, [user, authLoading, hasSeenOnboarding, segments, browsing]);

  if (authLoading || hasSeenOnboarding === null) return <Splash />;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: night.paper }, animation: 'slide_from_right' }}>
      {SHEETS.map((name) => (
        <Stack.Screen key={name} name={name} options={{ presentation: 'transparentModal', animation: 'slide_from_bottom', contentStyle: { backgroundColor: 'transparent' } }} />
      ))}
      <Stack.Screen name="purchase/confirmed" options={{ animation: 'fade', gestureEnabled: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    BebasNeue: BebasNeue_400Regular,
    InstrumentSans: InstrumentSans_400Regular,
    'InstrumentSans-Medium': InstrumentSans_500Medium,
    'InstrumentSans-SemiBold': InstrumentSans_600SemiBold,
    'InstrumentSans-Bold': InstrumentSans_700Bold,
    'JetBrainsMono-Medium': JetBrainsMono_500Medium,
    'JetBrainsMono-Bold': JetBrainsMono_700Bold,
  });

  if (!fontsLoaded) return <Splash />;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <OnboardingProvider>
          <RedirectGate />
        </OnboardingProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
