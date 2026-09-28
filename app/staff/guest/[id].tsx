import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { T, H1, Screen, TopBar, StaffGate, Avatar, Pill, KV, Field, PrimaryButton, OutlineButton } from '../../../src/components/night';
import { useTicket } from '../../../src/hooks/useTicket';
import { useProfile } from '../../../src/hooks/useProfile';
import { staffStore } from '../../../src/store';
import { checkInTicket, saveStaffNote, undoCheckIn } from '../../../src/services/ticketService';
import { clock, shortDate, stamp } from '../../../src/lib/dates';
import { night } from '../../../src/theme/night';

export default function GuestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { ticket: t, loading } = useTicket(id);
  const { profile, user } = useProfile();
  const { door } = staffStore.useStore();
  const [note, setNote] = useState('');

  useEffect(() => setNote(t?.staffNote ?? ''), [t?.id]);

  if (loading || !t) return <View style={{ flex: 1, justifyContent: 'center', backgroundColor: night.ink }}><ActivityIndicator color={night.paper} /></View>;

  const act = (mode: 'undo' | 'checkout') =>
    Alert.alert(mode === 'undo' ? 'Undo check-in?' : 'Check out?', mode === 'undo' ? 'Only for mistakes. This is logged.' : 'They can be scanned back in later.', [
      { text: 'Cancel', style: 'cancel' },
      { text: mode === 'undo' ? 'Undo' : 'Check out', style: 'destructive', onPress: () => user && undoCheckIn(t.id, user.uid, mode) },
    ]);

  return (
    <StaffGate>
      <Screen bg={night.ink} dark>
        <TopBar dark />
        <View style={{ alignItems: 'center', gap: 10 }}>
          <Avatar name={t.userName} size={84} ring={night.ink} />
          <H1 size={44} color={night.paper}>{t.userName ?? 'Guest'}</H1>
          {t.checkedIn ? <Pill label="CHECKED IN" bg={night.lime} mono /> : t.status === 'confirmed' ? <Pill label="NOT IN YET" bg={night.ink2} color={night.paper} mono /> : <Pill label="NOT PAID" bg={night.amber} mono />}
        </View>
        <View style={{ padding: 16, borderRadius: 20, backgroundColor: night.ink3, gap: 10 }}>
          <KV dark k="Ticket" v={`${t.quantity > 1 ? `${t.quantity} × ` : ''}${t.tier} · ${t.id}`} />
          <KV dark k="Event" v={`${t.eventTitle ?? ''} · ${shortDate(t.eventDate, t.eventTime)}`} mono={false} />
          {t.checkedIn && <KV dark k="Checked in" v={[clock(t.checkedInAt), t.checkedInDoor, t.checkedInBy].filter(Boolean).join(' · ')} />}
          <KV dark k="Bought by" v={t.userName ?? ''} mono={false} />
          <KV dark k="Payment" v={t.validatedAt ? `Verified ${stamp(t.validatedAt)}` : t.status.replace('_', ' ')} mono={false} />
        </View>
        <Field dark label="STAFF NOTE" value={note} onChangeText={setNote} multiline placeholder="E.g. stepped out to the car, back in 10" />
        {note !== (t.staffNote ?? '') && <OutlineButton dark label="Save note" onPress={() => saveStaffNote(t.id, note.trim())} />}
        {t.checkedIn ? (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <PrimaryButton tone="paper" label="Check out" arrow={false} center style={{ flex: 1 }} onPress={() => act('checkout')} />
            <OutlineButton dark label="Undo check-in" style={{ flex: 1 }} height={58} onPress={() => act('undo')} />
          </View>
        ) : t.status === 'confirmed' ? (
          <PrimaryButton tone="orange" label="Check in" onPress={() => user && checkInTicket(t.id, { door, staffName: profile?.name ?? 'Staff', staffUid: user.uid })} />
        ) : null}
        <T size={13} color={night.inkMuted} center>Check out lets them back in later. Undo is for mistakes and gets logged.</T>
      </Screen>
    </StaffGate>
  );
}
