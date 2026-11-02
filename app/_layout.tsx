import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
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
import UpdateRequired from '../src/components/night/UpdateRequired';
import OfflineBanner from '../src/components/night/OfflineBanner';
import { useUpdateRequired } from '../src/hooks/useMinVersion';
import { night } from '../src/theme/night';
import { useTicketAlerts } from '../src/hooks/useTicketAlerts';
import { redirectTarget } from '../src/lib/redirect';

// Routes presented as bottom sheets (transparent modals that draw their own backdrop).
const SHEETS = ['filters', 'purchase/tickets', 'purchase/promo', 'waitlist/join', 'ticket/send', 'staff/reject'];

function TicketAlerts() {
  useTicketAlerts();
  return null;
}

function RedirectGate() {
  const { user, loading: authLoading, browsing } = useAuth();
  const { hasSeenOnboarding, hasSeenGuide } = useOnboarding();
  const segments = useSegments();
  const router = useRouter();
  const updateRequired = useUpdateRequired();

  // The route as a string (useSegments() returns a new array every render),
  // and the redirect already on its way, so the same one is never sent
  // twice while navigation catches up.
  const path = segments.join('/');
  const pending = useRef<string | null>(null);
  const [retries, setRetries] = useState(0);

  useEffect(() => {
    if (authLoading || hasSeenOnboarding === null || hasSeenGuide === null) return;

    const target = redirectTarget({ segments: segments as string[], loggedIn: !!user, browsing, hasSeenOnboarding, hasSeenGuide });

    if (!target) {
      pending.current = null;
      return;
    }
    if (pending.current !== target) {
      pending.current = target;
      router.replace(target as any);
    }
    // If navigation wasn't ready and the redirect was dropped, try again.
    const retry = setTimeout(() => {
      if (pending.current === target) {
        pending.current = null;
        setRetries((n) => n + 1);
      }
    }, 1500);
    return () => clearTimeout(retry);
  }, [user, authLoading, hasSeenOnboarding, hasSeenGuide, path, browsing, retries]);

  if (authLoading || hasSeenOnboarding === null || hasSeenGuide === null) return <Splash />;
  if (updateRequired) return <UpdateRequired />;

  return (
    <>
    <TicketAlerts />
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: night.paper }, animation: 'slide_from_right' }}>
      {SHEETS.map((name) => (
        <Stack.Screen key={name} name={name} options={{ presentation: 'transparentModal', animation: 'slide_from_bottom', contentStyle: { backgroundColor: 'transparent' } }} />
      ))}
      <Stack.Screen name="purchase/confirmed" options={{ animation: 'fade', gestureEnabled: false }} />
    </Stack>
    <OfflineBanner />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BebasNeue: BebasNeue_400Regular,
    InstrumentSans: InstrumentSans_400Regular,
    'InstrumentSans-Medium': InstrumentSans_500Medium,
    'InstrumentSans-SemiBold': InstrumentSans_600SemiBold,
    'InstrumentSans-Bold': InstrumentSans_700Bold,
    'JetBrainsMono-Medium': JetBrainsMono_500Medium,
    'JetBrainsMono-Bold': JetBrainsMono_700Bold,
  });

  // Never wait on the fonts for long. If they fail to load (e.g. a damaged
  // copy in the phone's cache) or are slow, the app still opens, using
  // the system font until they arrive.
  const [fontWaitOver, setFontWaitOver] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setFontWaitOver(true), 3000);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (fontError) console.warn('Fonts failed to load, using system fonts:', fontError.message);
  }, [fontError]);

  // Our own splash (below) looks the same as the native one, so hide the
  // native one as soon as JavaScript runs.
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  if (!fontsLoaded && !fontError && !fontWaitOver) return <Splash />;

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
