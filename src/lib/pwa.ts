import { Platform } from 'react-native';

// The installable web app (PWA): on iPhone and Android the website can be
// added to the home screen, where it opens full screen with its own icon
// and works without signal. Only does anything in a real web build.

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

const isWeb = Platform.OS === 'web' && typeof window !== 'undefined' && typeof navigator !== 'undefined';

let deferred: InstallPrompt | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

// The folder the app lives in (/ or /friends-app/), worked out from the
// favicon link the build puts in the page.
function appFolder(): string | null {
  const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.href;
  return icon ? new URL('.', icon).href : null;
}

if (isWeb) {
  // Android Chrome offers "Install app" through this event. Keep it so our
  // own Install button can show the prompt later.
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as InstallPrompt;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    notify();
  });

  // Offline support. Not in development (`expo start`), where files change
  // on every save and a saved copy would get in the way.
  if (!__DEV__ && 'serviceWorker' in navigator) {
    const folder = appFolder();
    if (folder) {
      const register = () =>
        navigator.serviceWorker
          .register(`${folder}sw.js`, { scope: folder })
          .then((reg) => {
            // Look for a newer version whenever the app comes back to the
            // front (phones keep web apps open for days).
            document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && reg.update().catch(() => {}));
          })
          .catch((e) => console.warn('Offline support unavailable:', e?.message));
      // A newer version has taken over: reload once into it, so nobody is
      // left running an old copy. (Not on the very first install.)
      const hadController = !!navigator.serviceWorker.controller;
      let reloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!hadController || reloaded) return;
        reloaded = true;
        window.location.reload();
      });
      if (document.readyState === 'complete') register();
      else window.addEventListener('load', register, { once: true });
    }
  }
}

export type Device = 'ios' | 'android' | 'other';

export function webDevice(): Device {
  if (!isWeb) return 'other';
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/.test(ua) || (ua.includes('Macintosh') && (navigator as any).maxTouchPoints > 1)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'other';
}

// Already opened from the home screen (full screen, no browser bars).
export function isInstalled(): boolean {
  if (!isWeb) return false;
  return (navigator as any).standalone === true || !!window.matchMedia?.('(display-mode: standalone)').matches;
}

export function canPromptInstall() {
  return !!deferred;
}

// Shows Chrome's own "Install app" dialog. Resolves true if they installed.
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  const d = deferred;
  deferred = null;
  notify();
  await d.prompt();
  return (await d.userChoice).outcome === 'accepted';
}

export function onInstallChange(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
