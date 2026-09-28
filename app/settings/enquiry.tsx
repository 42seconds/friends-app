import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { T, H1, Amp, Screen, Hero, Card, Timeline, KV, PrimaryButton, Pill } from '../../src/components/night';
import { night } from '../../src/theme/night';

// Confirmation + tracker after sending a host enquiry.
export default function EnquirySentScreen() {
  const p = useLocalSearchParams<{ id: string; type: string; space: string; date: string; guests: string }>();
  const router = useRouter();
  return (
    <Screen
      padTop={false}
      footer={<PrimaryButton label="Back to Explore" onPress={() => router.replace('/(tabs)/home')} />}
      hero={
        <Hero bg={night.ink} gap={14}>
          <Amp size={320} color={night.ink2} style={{ right: -40, top: 0 }} />
          <View style={{ flexDirection: 'row', marginTop: 10 }}>
            <Pill label={`ENQ-${(p.id ?? '').slice(0, 6).toUpperCase()}`} bg={night.ink2} color={night.paper} mono />
          </View>
          <H1 size={72} color={night.paper}>Enquiry{'\n'}sent!</H1>
          <T size={15} lh={1.5} color={night.inkMuted}>We'll be in touch soon by email.</T>
        </Hero>
      }
    >
      <Card>
        <Timeline
          steps={[
            { label: 'Received', sub: 'Just now', state: 'done' },
            { label: 'Team is reviewing', sub: 'Checking dates and the space', state: 'current' },
            { label: 'Chat and quote', sub: 'We call or email you', state: 'todo' },
            { label: 'Booked', sub: 'Your event goes on &FRIENDS', state: 'todo' },
          ]}
        />
      </Card>
      <Card>
        <T mono weight="700" size={11} color={night.muted}>YOUR ENQUIRY</T>
        <KV k="Type" v={p.type ?? ''} mono={false} />
        <KV k="Space" v={p.space ?? ''} mono={false} />
        {!!p.date && <KV k="Date" v={p.date} mono={false} />}
        {!!p.guests && <KV k="Guests" v={`About ${p.guests}`} mono={false} />}
      </Card>
    </Screen>
  );
}
