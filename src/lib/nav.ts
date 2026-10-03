// Go back if there is somewhere to go back to; otherwise land on a sensible
// screen instead of dispatching a GO_BACK nobody can handle (which happens
// when a screen was opened directly, e.g. after a redirect or deep link).
interface BackRouter {
  canGoBack: () => boolean;
  back: () => void;
  replace: (href: any) => void;
}

export function safeBack(router: BackRouter, fallback: string = '/(tabs)/home') {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}
