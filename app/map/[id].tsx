import { Share, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { T, H2, Screen, IconButton, MapArt, PrimaryButton, OutlineButton } from '../../src/components/night';
import { useEvent } from '../../src/hooks/useEvents';
import { openMap } from '../../src/lib/booking';
import { shortDate } from '../../src/lib/dates';
import { night } from '../../src/theme/night';
import { safeBack } from '../../src/lib/nav';

// Event location: address, copy/share, open in Maps.
export default function EventMapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { event } = useEvent(id);
  const address = event?.address ?? `${event?.location ?? ''}, Braamfontein, Johannesburg`;

  return (
    <Screen
      padTop={false}
      headerBg={night.sand}
      header={
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <IconButton icon="arrow-back" label="Back" onPress={() => safeBack(router)} />
          <IconButton icon="open-outline" label="Open in Maps" onPress={() => openMap(address)} />
        </View>
      }
      hero={<MapArt height={320} />}
      contentStyle={{ marginTop: -24, backgroundColor: night.paper, borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
    >
      <T mono weight="700" size={11} color={night.muted}>{`${event?.title ?? ''} · ${shortDate(event?.date, event?.time)} ${event?.time ?? ''}`.toUpperCase()}</T>
      <H2 size={36}>{event?.location}</H2>
      <T size={14} color={night.body}>{address}</T>
      <PrimaryButton label="Directions" icon="navigate" onPress={() => router.push(`/directions/${id}`)} />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <OutlineButton label="Copy" icon="copy-outline" style={{ flex: 1 }} onPress={() => Clipboard.setStringAsync(address)} />
        <OutlineButton label="Share" icon="share-outline" style={{ flex: 1 }} onPress={() => Share.share({ message: `${event?.title}: ${address}` })} />
      </View>
    </Screen>
  );
}
