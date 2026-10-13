import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  getHasSeenOnboarding,
  setHasSeenOnboarding as persistOnboardingSeen,
  getHasSeenGuide,
  setHasSeenGuide as persistGuideSeen,
} from '../utils/storage';

interface OnboardingContextType {
  hasSeenOnboarding: boolean | null; // null = still loading from storage
  markOnboardingSeen: () => Promise<void>;
  hasSeenGuide: boolean | null; // the "How &FRIENDS works" guide after first login
  markGuideSeen: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType>({
  hasSeenOnboarding: null,
  markOnboardingSeen: async () => {},
  hasSeenGuide: null,
  markGuideSeen: async () => {},
});

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const [hasSeenGuide, setHasSeenGuide] = useState<boolean | null>(null);

  useEffect(() => {
    getHasSeenOnboarding().then(setHasSeenOnboarding).catch(() => setHasSeenOnboarding(false));
    getHasSeenGuide().then(setHasSeenGuide).catch(() => setHasSeenGuide(false));
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

  const markGuideSeen = async () => {
    setHasSeenGuide(true);
    await persistGuideSeen().catch(() => {});
  };

  return (
    <OnboardingContext.Provider value={{ hasSeenOnboarding, markOnboardingSeen, hasSeenGuide, markGuideSeen }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export const useOnboarding = () => useContext(OnboardingContext);