import { Platform, Share, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { T, H1, Screen, TopBar, QR, PrimaryButton, OutlineButton, Note } from '../../src/components/night';
import { APP_URL } from '../../src/services/bookingEmails';
import { night } from '../../src/theme/night';

const LINK = `${APP_URL}/`;

function Step({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
      <View style={{ width: 26, height: 26, borderRadius: 99, backgroundColor: night.ink, alignItems: 'center', justifyContent: 'center' }}>
        <T size={13} weight="700" color={night.paper}>{n}</T>
      </View>
      <T size={14} style={{ flex: 1 }}>{children}</T>
    </View>
  );
}

// "Get the app": a QR code for the online version. Scanning it opens
// &friends in the phone's browser, where it's added to the home screen
// and then works like an installed app (offline too). No download, no
// app store. Show it at the door or share the link.
export default function GetAppScreen() {
  const share = () => Share.share({ message: `Get &friends on your phone: ${LINK}\nOpen it, then Share → Add to Home Screen (iPhone) or ⋮ → Install app (Android).` });

  return (
    <Screen header={<TopBar />} footer={<PrimaryButton label="Share the link" icon="share-social-outline" arrow={false} center onPress={share} />}>
      <H1 size={56}>Get the{'\n'}app</H1>
      <T size={15} lh={1.5} color={night.body}>Scan with the phone's camera. It opens &amp;friends online: add it to the home screen and it works like an app, even without signal. No download, no app store.</T>

      <View style={{ alignItems: 'center', gap: 10, paddingVertical: 8 }}>
        <View style={{ padding: 10, borderRadius: 24, backgroundColor: night.ink }}>
          <QR value={LINK} size={220} />
        </View>
        <T mono size={13} color={night.muted}>{LINK.replace('https://', '')}</T>
      </View>

      <View style={{ gap: 10 }}>
        <T size={12} weight="600" ls={1} color={night.muted}>IPHONE (SAFARI)</T>
        <Step n="1">Scan the code and open the link</Step>
        <Step n="2">Tap <Ionicons name="share-outline" size={15} color={night.ink} /> Share, then "Add to Home Screen"</Step>
      </View>
      <View style={{ gap: 10 }}>
        <T size={12} weight="600" ls={1} color={night.muted}>ANDROID (CHROME)</T>
        <Step n="1">Scan the code and open the link</Step>
        <Step n="2">Tap "Install the app" on Explore, or <Ionicons name="ellipsis-vertical" size={14} color={night.ink} /> then "Install app"</Step>
      </View>

      <OutlineButton label="Copy the link" icon="copy-outline" onPress={() => Clipboard.setStringAsync(LINK)} />
      {Platform.OS !== 'web' && (
        <Note icon="information-circle-outline" tone="cream">
          <T size={13} lh={1.5}>Same accounts, events and tickets as this app.</T>
        </Note>
      )}
    </Screen>
  );
}
