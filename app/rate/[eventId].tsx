import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T, H1, Amp, Screen, Hero, TopBar, IconButton, SectionLabel, Chip, ChipRow, Field, ListGroup, ToggleRow, PrimaryButton } from '../../src/components/night';
import { useEvent } from '../../src/hooks/useEvents';
import { useAuth } from '../../src/context/AuthContext';
import { sendRating } from '../../src/services/communityService';
import { shortDate } from '../../src/lib/dates';
import { night } from '../../src/theme/night';
import { safeBack } from '../../src/lib/nav';

const WORDS = ['', 'Not great', 'It was ok', 'Good', 'Really good', 'Unforgettable'];
const HIGHLIGHTS = ['The music', 'The crowd', 'Venue', 'Sound', 'Door speed', 'Felt safe'];

export default function RateScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { event } = useEvent(eventId);
  const [stars, setStars] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [fix, setFix] = useState('');
  const [anon, setAnon] = useState(false);
  const [sending, setSending] = useState(false);

  const send = async () => {
    setSending(true);
    try {
      await sendRating({ eventId, userId: anon ? null : user?.uid ?? null, stars, highlights: picked, fix: fix.trim(), anonymous: anon });
      Alert.alert('Thank you!', 'We read every one of these.');
      safeBack(router);
    } catch {
      Alert.alert("Couldn't send", 'Check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen header={<TopBar dark right={<IconButton label="Later" tone="onColor" onPress={() => safeBack(router)}><T size={14} weight="600">Later</T></IconButton>} />} headerBg={night.orange}
      padTop={false}
      hero={
        <Hero bg={night.orange} gap={12}>
          <Amp size={300} color={night.orangeDeep} style={{ right: -40, top: 0 }} />
          <T mono weight="700" size={11} style={{ marginTop: 20 }}>{`${shortDate(event?.date, event?.time)} · ${event?.title ?? ''}`.toUpperCase()}</T>
          <H1 size={60}>How was{'\n'}your night?</H1>
        </Hero>
      }
      footer={<PrimaryButton label="Send feedback" disabled={!stars} loading={sending} onPress={send} />}
    >
      <View style={{ alignItems: 'center', gap: 8 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} accessibilityRole="button" accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`} onPress={() => setStars(n)} hitSlop={4}>
              <Ionicons name={n <= stars ? 'star' : 'star-outline'} size={42} color={n <= stars ? night.orange : night.handle} />
            </Pressable>
          ))}
        </View>
        <T size={15} weight="600">{WORDS[stars] || 'Tap to rate'}</T>
      </View>
      <SectionLabel>WHAT STOOD OUT?</SectionLabel>
      <ChipRow>
        {HIGHLIGHTS.map((h) => (
          <Chip key={h} label={h} active={picked.includes(h)} onPress={() => setPicked((p) => (p.includes(h) ? p.filter((x) => x !== h) : [...p, h]))} />
        ))}
      </ChipRow>
      <Field label="ANYTHING WE SHOULD FIX?" value={fix} onChangeText={setFix} placeholder="Bar queues, sound, anything…" multiline maxLength={1000} />
      {!!event?.gallery?.length && (
        <Pressable onPress={() => router.push(`/gallery/${eventId}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, backgroundColor: night.card, borderWidth: 1.5, borderColor: night.line }}>
          <Ionicons name="images-outline" size={20} color={night.ink} />
          <T size={15} weight="600" style={{ flex: 1 }}>See the photos from the night</T>
          <Ionicons name="chevron-forward" size={18} color={night.muted} />
        </Pressable>
      )}
      <ListGroup>
        <ToggleRow title="Post anonymously" value={anon} onChange={setAnon} />
      </ListGroup>
    </Screen>
  );
}
