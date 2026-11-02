// Where the app should send someone, given who they are and where they
// are. null = stay. Kept pure so every case can be tested.

// Routes a logged-out visitor may open while "just browsing".
export const BROWSABLE = new Set(['(tabs)', 'event', 'search', 'filters', 'brand', 'venue', 'past', 'offline']);

// Info pages anyone can read, logged in or not (linked from sign-up).
export const PUBLIC = new Set(['settings/legal', 'settings/help', 'settings/about', 'settings/venue-info']);

export interface RedirectState {
  segments: string[];
  loggedIn: boolean;
  browsing: boolean;
  hasSeenOnboarding: boolean;
  hasSeenGuide: boolean;
}

export function redirectTarget({ segments, loggedIn, browsing, hasSeenOnboarding, hasSeenGuide }: RedirectState): string | null {
  const group = segments[0];
  const path = segments.join('/');
  const inOnboarding = group === '(onboarding)';
  const inAuth = group === '(auth)';

  // The start screen ("/") only shows the splash: always move on from it.
  // Without this, someone already logged in stayed on the "&" forever
  // when reopening the app.
  if (!group) return loggedIn ? (hasSeenGuide ? '/(tabs)/home' : '/guide') : browsing ? '/(tabs)/home' : hasSeenOnboarding ? '/(auth)/login' : '/(onboarding)/welcome';
  if (PUBLIC.has(path)) return null;
  // Onboarding is only for people who aren't logged in.
  if (!loggedIn && !hasSeenOnboarding && !inOnboarding && !inAuth && !browsing) return '/(onboarding)/welcome';
  if (!loggedIn && !inAuth && !inOnboarding && !(browsing && BROWSABLE.has(group))) return browsing ? '/(tabs)/home' : '/(auth)/login';
  if (loggedIn && (inAuth || inOnboarding)) return hasSeenGuide ? '/(tabs)/home' : '/guide';
  // First login on this phone: show "How &FRIENDS works" once. The
  // confirm-email and notifications steps after sign-up come first.
  if (loggedIn && !hasSeenGuide && path !== 'guide' && path !== 'notifications-optin' && path !== 'verify-email') return '/guide';
  return null;
}
