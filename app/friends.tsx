import { Linking, Pressable, Share, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { T, H1, Screen, TopBar, EmptyState, IconName } from '../src/components/night';
import { whatsappLink } from '../src/lib/booking';
import { night } from '../src/theme/night';

function Action({ icon, label, bg, onPress }: { icon: IconName; label: string; bg: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ flex: 1, padding: 14, borderRadius: 18, backgroundColor: bg, gap: 14, opacity: pressed ? 0.85 : 1 })}>
      <Ionicons name={icon} size={24} color={night.ink} />
      <T size={15} weight="700">{label}</T>
    </Pressable>
  );
}

// Friends: invite your people. (Friend lists and "who's going" need a
// friends backend; until then this screen is for inviting.)
export default function FriendsScreen() {
  const invite = 'Come find events in Braam with me on &FRIENDS.';
  return (
    <Screen header={<TopBar />}>
      <H1 size={60}>Friends</H1>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Action icon="logo-whatsapp" label="Invite on WhatsApp" bg={night.lime} onPress={() => Linking.openURL(whatsappLink(invite))} />
        <Action icon="share-social-outline" label="Share an invite" bg={night.blue} onPress={() => Share.share({ message: invite })} />
      </View>
      <EmptyState icon="people-outline" tileBg={night.yellow} title="Bring your people" body="Invite friends so you can send them tickets and plan nights together. Only friends you accept will see what you're going to." />
    </Screen>
  );
}
