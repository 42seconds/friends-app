import { Linking, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T, H1, Screen, TopBar, PrimaryButton, OutlineButton } from '../../src/components/night';
import { night } from '../../src/theme/night';

// Shown when camera/photo access was refused. Also used by staff scanning.
export default function CameraPermissionScreen() {
  const { ticketId, source } = useLocalSearchParams<{ ticketId?: string; source?: string }>();
  const router = useRouter();
  return (
    <Screen header={<TopBar />}
      fill
      footer={
        <>
          <PrimaryButton label="Open settings" onPress={() => Linking.openSettings()} />
          {ticketId && source === 'camera' && <OutlineButton label="Upload from photos instead" onPress={() => router.replace(`/purchase/upload-pop?ticketId=${ticketId}&source=photos`)} />}
          <T size={12} color={night.muted} center>Said no before? Turn it on in Settings › &amp;FRIENDS › {source === 'photos' ? 'Photos' : 'Camera'}.</T>
        </>
      }
    >
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingTop: 40 }}>
        <View style={{ width: 170, height: 170 }}>
          <View style={{ flex: 1, borderRadius: 36, backgroundColor: night.ink, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="camera-outline" size={80} color={night.orange} />
          </View>
          <View style={{ position: 'absolute', right: -14, top: -14, width: 56, height: 56, borderRadius: 99, backgroundColor: night.lime, alignItems: 'center', justifyContent: 'center' }}>
            <T display size={34}>&amp;</T>
          </View>
        </View>
        <H1 size={52}>{source === 'photos' ? 'Photos, please' : 'Camera, please'}</H1>
        <T size={15} lh={1.5} center color={night.body} style={{ maxWidth: 290 }}>
          We use the camera for two things only: <T size={15} weight="700">scanning QR codes at the door</T> and <T size={15} weight="700">photographing your proof of payment</T>. Nothing is recorded.
        </T>
      </View>
    </Screen>
  );
}
