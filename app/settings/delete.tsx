import { useState } from 'react';
import { Alert, View } from 'react-native';
import { useRouter } from 'expo-router';
import { T, H1, Screen, TopBar, Note, Card, SectionLabel, Chip, ChipRow, Field, SlideToConfirm, TextLink } from '../../src/components/night';
import { useBookings } from '../../src/hooks/useBookings';
import { effectiveStatus } from '../../src/services/ticketService';
import { deleteAccount, authErrorMessage, logoutUser } from '../../src/services/authService';
import { isPast } from '../../src/lib/dates';
import { night } from '../../src/theme/night';

const REASONS = ['Not using it', 'Too many notifications', 'Privacy worries', 'Other'];

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { tickets } = useBookings();
  const [reason, setReason] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const upcoming = tickets.filter((t) => effectiveStatus(t) === 'confirmed' && !isPast(t.eventDate, t.eventTime)).length;

  const confirm = async () => {
    try {
      await deleteAccount(reason ?? undefined);
    } catch (e: any) {
      const msg = authErrorMessage(e);
      if (String(e?.code).includes('requires-recent-login')) {
        Alert.alert('Log in again first', msg, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log out', onPress: () => logoutUser() },
        ]);
      } else Alert.alert("Couldn't delete", msg);
    }
  };

  return (
    <Screen>
      <TopBar />
      <H1 size={56}>Delete your{'\n'}account</H1>
      <T size={15} color={night.body}>This can't be undone. Here's what happens first.</T>
      {upcoming > 0 && (
        <Note tone="cream" icon="warning-outline">
          <View style={{ gap: 6 }}>
            <T size={14} lh={1.5}>
              <T size={14} weight="700">You have {upcoming} upcoming ticket{upcoming > 1 ? 's' : ''}.</T> Send {upcoming > 1 ? 'them' : 'it'} to a friend or release {upcoming > 1 ? 'them' : 'it'} first, or {upcoming > 1 ? "they'll" : "it'll"} be cancelled without a refund.
            </T>
            <TextLink label="Go to my tickets" onPress={() => router.push('/(tabs)/tickets')} />
          </View>
        </Note>
      )}
      <Card>
        <T size={15} weight="700">What gets deleted</T>
        <T size={14} lh={1.5} color={night.body}>Your profile, interests and refund bank details. Saved events on this phone are cleared when you log out.</T>
        <T size={15} weight="700">What we have to keep</T>
        <T size={14} lh={1.5} color={night.body}>Payment records, for as long as South African tax law requires.</T>
      </Card>
      <SectionLabel>WHY ARE YOU LEAVING? (OPTIONAL)</SectionLabel>
      <ChipRow>
        {REASONS.map((r) => (
          <Chip key={r} label={r} active={reason === r} onPress={() => setReason(reason === r ? null : r)} />
        ))}
      </ChipRow>
      <Field label="TYPE DELETE TO CONFIRM" value={typed} onChangeText={setTyped} autoCapitalize="characters" mono />
      <SlideToConfirm danger label="Slide to delete forever" disabled={typed.trim().toUpperCase() !== 'DELETE'} onConfirm={confirm} />
    </Screen>
  );
}
