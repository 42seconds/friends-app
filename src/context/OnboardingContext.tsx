import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  getHasSeenOnboarding,
  setHasSeenOnboarding as persistOnboardingSeen,
} from '../utils/storage';

interface OnboardingContextType {
  hasSeenOnboarding: boolean | null; // null = still loading from storage
  markOnboardingSeen: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType>({
  hasSeenOnboarding: null,
  markOnboardingSeen: async () => {},
});

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    getHasSeenOnboarding().then(setHasSeenOnboarding);
  }, []);

  // Writes to AsyncStorage AND updates in-memory state together.
  // This is the actual fix for the loop: previously welcome.tsx wrote
  // to AsyncStorage directly and navigated away, but _layout only knew
  // the OLD value because it never re-read storage after mount. Now,
  // every screen using this context sees the change immediately —
  // no second storage read, no race condition, no stale flag.
  const markOnboardingSeen = async () => {
    await persistOnboardingSeen();
    setHasSeenOnboarding(true);
  };

  return (
    <OnboardingContext.Provider value={{ hasSeenOnboarding, markOnboardingSeen }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export const useOnboarding = () => useContext(OnboardingContext);