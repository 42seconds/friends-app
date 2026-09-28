import { useState } from 'react';
import { Image, Linking, Modal, Pressable, View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { T, H1, Screen, TopBar, EmptyState, PrimaryButton, IconButton } from '../../src/components/night';
import { useEvent } from '../../src/hooks/useEvents';
import { shortDate } from '../../src/lib/dates';
import { subBrandFor } from '../../src/lib/subbrands';
import { support } from '../../src/config/payment';
import { night } from '../../src/theme/night';

// Photo gallery for a past event (event.gallery holds image URLs).
export default function GalleryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { event } = useEvent(id);
  const [open, setOpen] = useState<string | null>(null);
  const photos = event?.gallery ?? [];
  const cell = (width - 40 - 8) / 3;

  return (
    <Screen
      bg={night.ink}
      dark
      footer={
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <PrimaryButton tone="paper" label="Add yours" icon="add" arrow={false} center style={{ flex: 1 }} onPress={() => Linking.openURL(`mailto:${support.email}?subject=${encodeURIComponent(`Photos from ${event?.title ?? 'the night'}`)}`)} />
          <PrimaryButton tone="orange" label="Next one" style={{ flex: 1 }} onPress={() => router.push(`/brand/${subBrandFor(event?.tag).key}`)} />
        </View>
      }
      footerDark
    >
      <TopBar dark />
      <T mono weight="700" size={11} color={night.inkMuted}>{`${shortDate(event?.date, event?.time)} · ${event?.location ?? ''}`.toUpperCase()}</T>
      <H1 size={52} color={night.paper}>{event?.title ?? 'Gallery'}</H1>
      {!photos.length ? (
        <EmptyState dark icon="images-outline" tileBg={night.ink2} iconColor={night.orange} title="Photos coming" body="The crew posts photos a few days after the night. Check back soon." />
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
          {photos.map((uri, i) => (
            <Pressable key={uri + i} accessibilityRole="imagebutton" accessibilityLabel={`Photo ${i + 1}`} onPress={() => setOpen(uri)}>
              <Image source={{ uri }} style={{ width: i % 7 === 0 ? cell * 2 + 4 : cell, height: i % 7 === 0 ? cell * 2 + 4 : cell, borderRadius: 10, backgroundColor: night.ink2 }} />
            </Pressable>
          ))}
        </View>
      )}
      <Modal visible={!!open} transparent animationType="fade" onRequestClose={() => setOpen(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(14,13,11,0.96)', justifyContent: 'center' }}>
          {open && <Image source={{ uri: open }} style={{ width: '100%', height: '75%' }} resizeMode="contain" />}
          <View style={{ position: 'absolute', top: 60, right: 20 }}>
            <IconButton icon="close" label="Close" tone="dark" onPress={() => setOpen(null)} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
