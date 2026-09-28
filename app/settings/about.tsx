import { Linking, View } from 'react-native';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { T, H1, H2, Amp, Screen, Hero, TopBar, BrandTile, ListGroup, ListRow } from '../../src/components/night';
import { SUB_BRANDS } from '../../src/lib/subbrands';
import { support } from '../../src/config/payment';
import { night } from '../../src/theme/night';

export default function AboutScreen() {
  const router = useRouter();
  const [music, talk, fun, food] = SUB_BRANDS;
  return (
    <Screen header={<TopBar dark />} headerBg={night.orange}
      padTop={false}
      hero={
        <Hero bg={night.orange}>
          <Amp size={420} color={night.orangeDeep} style={{ right: -60, top: 0 }} />
          <View style={{ marginTop: 40 }}>
            <H1 size={80}>Made in{'\n'}Braam</H1>
          </View>
          <T size={16} lh={1.5} style={{ maxWidth: 300 }}>&amp;FRIENDS is a creative community space in Braamfontein. A place to talk, dance, eat and meet the people who make Joburg interesting.</T>
        </Hero>
      }
    >
      <H2>Four ways in</H2>
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <BrandTile brand={talk} height={130} titleSize={30} onPress={() => router.push('/brand/talk')} />
          <BrandTile brand={fun} height={130} titleSize={30} onPress={() => router.push('/brand/fun')} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <BrandTile brand={music} height={130} titleSize={30} onPress={() => router.push('/brand/music')} />
          <BrandTile brand={food} height={130} titleSize={30} onPress={() => router.push('/brand/food')} />
        </View>
      </View>
      <ListGroup>
        <ListRow icon="location-outline" iconBg={night.ink} iconColor={night.orange} title="Visit the space" subtitle="Hours, rooms and house rules" chevron onPress={() => router.push('/settings/venue-info')} />
        <ListRow icon="logo-instagram" title="Instagram" chevron onPress={() => Linking.openURL(support.instagram)} />
        <ListRow icon="chatbubble-ellipses-outline" title="WhatsApp channel" subtitle="Drops and announcements" chevron onPress={() => Linking.openURL(support.whatsappChannel)} />
      </ListGroup>
      <T mono size={11} color={night.faint} center>VERSION {Constants.expoConfig?.version ?? ''}</T>
    </Screen>
  );
}
