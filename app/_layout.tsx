import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { OnboardingProvider, useOnboarding } from '../src/context/OnboardingContext';
import { Tabs } from 'expo-router';
import { useUserRole } from '../src/hooks/useUserRole';

function RedirectGate() {
  const { user, loading: authLoading } = useAuth();
  const { hasSeenOnboarding } = useOnboarding();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (authLoading || hasSeenOnboarding === null) return;

    const inOnboardingGroup = segments[0] === '(onboarding)';
    const inAuthGroup = segments[0] === '(auth)';

    if (!hasSeenOnboarding && !inOnboardingGroup) {
      router.replace('/(onboarding)/welcome');
    } else if (!user && !inAuthGroup && !inOnboardingGroup) {
      router.replace('/(auth)/login');
    } else if (user && (inAuthGroup || inOnboardingGroup)) {
      router.replace('/(tabs)/home');
    }
  }, [user, authLoading, hasSeenOnboarding, segments]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <OnboardingProvider>
        <RedirectGate />
      </OnboardingProvider>
    </AuthProvider>
  );
}




