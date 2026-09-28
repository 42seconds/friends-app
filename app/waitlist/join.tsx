import { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { T, H2, Sheet, Stepper, ListGroup, ToggleRow, PrimaryButton } from '../../src/components/night';
import { useEvent } from '../../src/hooks/useEvents';
import { useProfile } from '../../src/hooks/useProfile';
import { joinWaitlist } from '../../src/services/communityService';
import { allIn, rand } from '../../src/lib/pricing';
import { shortDate } from '../../src/lib/dates';
import { night } from '../../src/theme/night';

const MAX = 2;

// Sheet: how many you need + WhatsApp alerts, then join.
export default function JoinWaitlistSheet() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();
  const { event } = useEvent(eventId);
  const { profile, user } = useProfile();
  const [qty, setQty] = useState(1);
  const [wa, setWa] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const price = event?.tickets?.length ? allIn(Math.min(...event.tickets.map((t) => t.price))) : 0;

  const join = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await joinWaitlist({ eventId, userId: user.uid, userName: profile?.name ?? '', quantity: qty, whatsappAlerts: wa });
      router.back();
    } catch {
      setError("Couldn't join right now. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet footer={<PrimaryButton label="Join waitlist" loading={saving} onPress={join} />}>
      <T mono size={12} color={night.muted}>{`${shortDate(event?.date, event?.time)} · ${event?.location ?? ''}`.toUpperCase()}</T>
      <H2 size={40}>Join the waitlist</H2>
      <T size={14} lh={1.5} color={night.body}>If someone can't make it, their ticket goes to the next person in line. Always at face value.</T>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 18, backgroundColor: night.card, borderWidth: 1.5, borderColor: night.line }}>
        <View style={{ flex: 1 }}>
          <T size={16} weight="600">How many do you need?</T>
          <T size={13} color={night.muted}>{rand(price)} all-in each · max {MAX}</T>
        </View>
        <Stepper value={qty} min={1} max={MAX} onChange={setQty} />
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[
          ['Free', 'to join'],
          ['30 min', 'to claim a spot'],
          ['No', 'mark-ups ever'],
        ].map(([a, b]) => (
          <View key={a} style={{ flex: 1, padding: 12, borderRadius: 16, backgroundColor: night.card, borderWidth: 1.5, borderColor: night.line }}>
            <T display size={26}>{a}</T>
            <T size={12} color={night.muted}>{b}</T>
          </View>
        ))}
      </View>
      <ListGroup>
        <ToggleRow title="Also alert me on WhatsApp" subtitle="So you don't miss your 30 minutes" value={wa} onChange={setWa} />
      </ListGroup>
      {!!error && <T size={14} weight="600" color={night.danger}>{error}</T>}
    </Sheet>
  );
}
