import { useEffect, useState } from 'react';
import { Alert, Image, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T, Screen, TopBar, Segmented, OutlineButton, PrimaryButton, CoachMark, FirstTicketTracker } from '../../src/components/night';
import { useFirstTicketGuide } from '../../src/hooks/useFirstTicketGuide';
import { useTicket } from '../../src/hooks/useTicket';
import { uploadProofOfPayment } from '../../src/services/paymentService';
import { pickProof, ProofSource } from '../../src/lib/proof';
import { rand } from '../../src/lib/pricing';
import { night } from '../../src/theme/night';

function Check({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ width: 22, height: 22, borderRadius: 99, backgroundColor: night.success, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="checkmark" size={14} color={night.paper} />
      </View>
      <T size={14} style={{ flex: 1 }}>{children}</T>
    </View>
  );
}

// Proof of payment: take a photo or pick a screenshot, check it, send.
export default function UploadProofScreen() {
  const { ticketId, source: initial } = useLocalSearchParams<{ ticketId: string; source?: ProofSource }>();
  const router = useRouter();
  const { ticket } = useTicket(ticketId);
  const [source, setSource] = useState<ProofSource>(initial ?? 'photos');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const guide = useFirstTicketGuide();

  const pick = async (s: ProofSource) => {
    setSource(s);
    const uri = await pickProof(s);
    if (uri === 'denied') {
      router.push(`/purchase/camera-permission?ticketId=${ticketId}&source=${s}`);
      return;
    }
    if (uri) setImageUri(uri);
  };

  useEffect(() => {
    pick(source);
  }, []);

  const submit = async () => {
    if (!imageUri || !ticketId) return;
    setUploading(true);
    try {
      await uploadProofOfPayment(ticketId, imageUri);
      router.replace(`/purchase/awaiting?ticketId=${ticketId}`);
    } catch (error: any) {
      console.error('Upload failed:', error);
      Alert.alert('Upload failed', error?.message ?? 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Screen header={<TopBar
        dark
        center={
          <View style={{ alignItems: 'center' }}>
            <T size={15} weight="600" color={night.paper}>Proof of payment</T>
            <T mono weight="700" size={11} color={night.inkMuted}>STEP 3 OF 4</T>
          </View>
        }
      />}
      bg={night.ink}
      dark
      footer={
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <OutlineButton dark label={imageUri ? 'Retake' : 'Choose'} onPress={() => pick(source)} style={{ flex: 1 }} height={58} />
          <PrimaryButton tone="orange" label="Use this photo" disabled={!imageUri} loading={uploading} onPress={submit} style={{ flex: 2 }} />
        </View>
      }
      footerDark
    >
      {guide && <FirstTicketTracker step={4} />}
      <CoachMark id="upload-pick" radius={99} text="Pick the screenshot of your payment. It's usually the newest one in Photos">
        <Segmented
          dark
          value={source}
          onChange={(s) => pick(s)}
          options={[
            { key: 'camera', label: 'Camera' },
            { key: 'photos', label: 'Photos' },
          ]}
        />
      </CoachMark>
      <View style={{ height: 380, borderRadius: 24, backgroundColor: night.ink2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} resizeMode="contain" accessibilityLabel="Your proof of payment" />
        ) : (
          <View style={{ alignItems: 'center', gap: 10 }}>
            <Ionicons name={source === 'camera' ? 'camera-outline' : 'image-outline'} size={44} color={night.inkMuted} />
            <T size={14} color={night.inkMuted}>No proof chosen yet</T>
          </View>
        )}
      </View>
      <View style={{ padding: 16, borderRadius: 20, backgroundColor: night.paper, gap: 10 }}>
        <T size={14} weight="600">Before you send, check it shows:</T>
        <Check>The amount, <T mono weight="700" size={14}>{ticket ? rand(ticket.totalPrice) : '…'}</T></Check>
        <Check>Your reference, <T mono weight="700" size={14}>{ticketId}</T></Check>
        <Check>Nothing blurry or cut off</Check>
      </View>
    </Screen>
  );
}
