import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

// On the web, NetInfo checks the connection by requesting the site's root
// ("/"). When the app lives in a sub-folder (GitHub Pages:
// /friends-app/) the root is someone else's page, or doesn't exist, and
// the app would wrongly think it's offline. Check the app's own favicon
// instead, which is always next to the app.
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.href;
  if (icon) {
    NetInfo.configure({ reachabilityUrl: icon, reachabilityMethod: 'HEAD', reachabilityTest: (r) => Promise.resolve(r.status === 200) });
  }
}
