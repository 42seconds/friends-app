import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { T, H1, Amp, Screen, Hero, TopBar, SectionLabel, Chip, ChipRow, Field, PrimaryButton } from '../../src/components/night';
import { useProfile } from '../../src/hooks/useProfile';
import { sendEnquiry } from '../../src/services/communityService';
import { SUB_BRANDS } from '../../src/lib/subbrands';
import { night } from '../../src/theme/night';

const TYPES = [
  { label: 'Live music', brand: SUB_BRANDS[0] },
  { label: 'Talk or panel', brand: SUB_BRANDS[1] },
  { label: 'Party or social', brand: SUB_BRANDS[2] },
  { label: 'Food pop-up', brand: SUB_BRANDS[3] },
];
const SPACES = ['Main floor', 'Rooftop', 'Gallery room', 'Not sure yet'];

export default function HostScreen() {
  const router = useRouter();
  const { profile, user } = useProfile();
  const [type, setType] = useState(TYPES[0].label);
  const [space, setSpace] = useState(SPACES[0]);
  const [date, setDate] = useState('');
  const [guests, setGuests] = useState('');
  const [vibe, setVibe] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile?.name) setName(profile.name);
  }, [profile]);

  const send = async () => {
    setSending(true);
    setError('');
    try {
      const id = await sendEnquiry({ userId: user?.uid ?? null, name: name.trim(), email: user?.email ?? '', company: company.trim(), type, space, date: date.trim(), guests: guests.trim(), vibe: vibe.trim() });
      router.replace(`/settings/enquiry?id=${id}&type=${encodeURIComponent(type)}&space=${encodeURIComponent(space)}&date=${encodeURIComponent(date)}&guests=${encodeURIComponent(guests)}`);
    } catch {
      setError("Couldn't send your enquiry. Try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen header={<TopBar />} headerBg={night.lime}
      padTop={false}
      footer={<PrimaryButton label="Send enquiry" disabled={!name.trim() || !vibe.trim()} loading={sending} onPress={send} />}
      hero={
        <Hero bg={night.lime}>
          <Amp size={320} color={night.limeDeep} style={{ right: -40, top: 0 }} />
          <View style={{ marginTop: 30 }}>
            <H1 size={68}>Host at{'\n'}&amp;Friends</H1>
          </View>
          <T size={15} lh={1.5} style={{ maxWidth: 300 }}>Talks, launches, parties, pop-ups. Tell us the idea and we'll help you make it happen.</T>
        </Hero>
      }
    >
      <SectionLabel>WHAT KIND OF EVENT?</SectionLabel>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {TYPES.map((t) => {
          const on = type === t.label;
          return (
            <Pressable key={t.label} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => setType(t.label)} style={{ width: '48.5%', flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 16, backgroundColor: night.card, borderWidth: on ? 2 : 1.5, borderColor: on ? night.ink : night.line }}>
              <View style={{ width: 14, height: 14, borderRadius: 99, backgroundColor: t.brand.color }} />
              <View>
                <T size={14} weight="600">{t.label}</T>
                <T mono weight="700" size={10} color={night.muted}>{t.brand.name.toUpperCase()}</T>
              </View>
            </Pressable>
          );
        })}
      </View>
      <SectionLabel>WHICH SPACE?</SectionLabel>
      <ChipRow>
        {SPACES.map((s) => (
          <Chip key={s} label={s} active={space === s} onPress={() => setSpace(s)} />
        ))}
      </ChipRow>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 3 }}>
          <Field label="DATE" value={date} onChangeText={setDate} placeholder="e.g. Sat 25 Jul" />
        </View>
        <View style={{ flex: 2 }}>
          <Field label="GUESTS" value={guests} onChangeText={setGuests} placeholder="About 120" keyboardType="number-pad" />
        </View>
      </View>
      <Field label="TELL US THE VIBE" value={vibe} onChangeText={setVibe} multiline placeholder="What's the idea? Sound, setup, food, anything we should know." />
      <Field label="YOUR NAME" value={name} onChangeText={setName} autoCapitalize="words" />
      <Field label="COMPANY" value={company} onChangeText={setCompany} placeholder="Optional" />
      {!!user?.email && <T size={13} color={night.muted}>We'll reply to {user.email}.</T>}
      {!!error && <T size={14} weight="600" color={night.danger}>{error}</T>}
    </Screen>
  );
}
