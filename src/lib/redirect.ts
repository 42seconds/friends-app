// Where the app should send someone, given who they are and where they
// are. null = stay. Kept pure so every case can be tested.

// Routes a logged-out visitor may open while "just browsing".
export const BROWSABLE = new Set(['(tabs)', 'event', 'search', 'filters', 'brand', 'venue', 'past', 'offline']);

// Info pages anyone can read, logged in or not (linked from sign-up).
export const PUBLIC = new Set(['settings/legal', 'settings/help', 'settings/about', 'settings/venue-info', 'settings/get-app']);

export interface RedirectState {
  segments: string[];
  loggedIn: boolean;
  browsing: boolean;
  hasSeenOnboarding: boolean;
  hasSeenGuide: boolean;
  // Admin 2-step: true = an admin who still has to enter the emailed
  // code on this device, false = not needed / done, null = still checking.
  adminCodeNeeded?: boolean | null;
  // The sign-up screen is creating the account and will move on itself.
  signingUp?: boolean;
}

export function redirectTarget({ segments, loggedIn, browsing, hasSeenOnboarding, hasSeenGuide, adminCodeNeeded = false, signingUp = false }: RedirectState): string | null {
  const group = segments[0];
  const path = segments.join('/');
  // Just created an account: the sign-up screen goes to "Confirm your
  // email" next; don't jump to the guide or Explore first.
  if (loggedIn && signingUp) return null;
  const inOnboarding = group === '(onboarding)';
  const inAuth = group === '(auth)';

  // The start screen ("/") only shows the splash: always move on from it.
  // Without this, someone already logged in stayed on the "&" forever
  // when reopening the app.
  if (!group) return loggedIn ? (adminCodeNeeded === true ? '/admin-verify' : hasSeenGuide ? '/(tabs)/home' : '/guide') : browsing ? '/(tabs)/home' : hasSeenOnboarding ? '/(auth)/login' : '/(onboarding)/welcome';
  if (PUBLIC.has(path)) return null;
  // Admins finish 2-step verification before anything else; once done,
  // they move on from the code screen.
  if (loggedIn && adminCodeNeeded === true) return path === 'admin-verify' ? null : '/admin-verify';
  if (path === 'admin-verify' && adminCodeNeeded === false) return loggedIn ? (hasSeenGuide ? '/(tabs)/home' : '/guide') : '/(auth)/login';
  // Onboarding is only for people who aren't logged in.
  if (!loggedIn && !hasSeenOnboarding && !inOnboarding && !inAuth && !browsing) return '/(onboarding)/welcome';
  if (!loggedIn && !inAuth && !inOnboarding && !(browsing && BROWSABLE.has(group))) return browsing ? '/(tabs)/home' : '/(auth)/login';
  // Changing your password (Settings → Privacy) uses the forgot-password screen.
  if (loggedIn && (inAuth || inOnboarding) && path !== '(auth)/forgot') return hasSeenGuide ? '/(tabs)/home' : '/guide';
  // First login on this phone: show "How &FRIENDS works" once. The
  // confirm-email and notifications steps after sign-up come first.
  if (loggedIn && !hasSeenGuide && path !== 'guide' && path !== 'notifications-optin' && path !== 'verify-email') return '/guide';
  return null;
}
