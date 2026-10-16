import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
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

// Routes a logged-out visitor may open while "just browsing".
const BROWSABLE = new Set(['(tabs)', 'event', 'search', 'filters', 'brand', 'venue', 'past', 'offline']);

// Info pages anyone can read, logged in or not (linked from sign-up).
const PUBLIC = new Set(['settings/legal', 'settings/help', 'settings/about', 'settings/venue-info']);

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

  useEffect(() => {
    if (authLoading || hasSeenOnboarding === null || hasSeenGuide === null) return;

    const group = segments[0] as string | undefined;
    const inOnboardingGroup = group === '(onboarding)';
    const inAuthGroup = group === '(auth)';

    let target: string | null = null;
    if (PUBLIC.has(path)) target = null;
    // Onboarding is only for people who aren't logged in. A logged-in user
    // who skipped it (e.g. tapped Log in on the first slide) would otherwise
    // bounce between Welcome and Explore forever.
    else if (!user && !hasSeenOnboarding && !inOnboardingGroup && !inAuthGroup && !browsing) target = '/(onboarding)/welcome';
    else if (!user && !inAuthGroup && !inOnboardingGroup && !(browsing && group && BROWSABLE.has(group))) target = browsing ? '/(tabs)/home' : '/(auth)/login';
    else if (user && (inAuthGroup || inOnboardingGroup)) target = hasSeenGuide ? '/(tabs)/home' : '/guide';
    // First login on this phone: show "How &FRIENDS works" once (it can be
    // skipped). The notifications step after sign-up comes first.
    else if (user && !hasSeenGuide && path !== 'guide' && path !== 'notifications-optin') target = '/guide';

    if (!target) {
      pending.current = null;
      return;
    }
    if (pending.current === target) return;
    pending.current = target;
    router.replace(target as any);
  }, [user, authLoading, hasSeenOnboarding, hasSeenGuide, path, browsing]);

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
