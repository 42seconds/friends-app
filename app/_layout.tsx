import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { OnboardingProvider, useOnboarding } from '../src/context/OnboardingContext';

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
  const [fontsLoaded] = useFonts({
    BebasNeue: BebasNeue_400Regular,
    Inter: Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1A1A1A" />
      </View>
    );
  }

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