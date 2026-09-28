import { Alert, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { H1, Screen, TopBar, SectionLabel, ListGroup, ListRow, ToggleRow, Pill } from '../../src/components/night';
import { useProfile } from '../../src/hooks/useProfile';
import { useBookings } from '../../src/hooks/useBookings';
import { prefsStore } from '../../src/store';
import { resetPassword, authErrorMessage } from '../../src/services/authService';
import { night } from '../../src/theme/night';

export default function PrivacyScreen() {
  const router = useRouter();
  const { profile, user } = useProfile();
  const { tickets } = useBookings();
  const prefs = prefsStore.useStore();

  const changePassword = async () => {
    if (!user?.email) return;
    try {
      await resetPassword(user.email);
      Alert.alert('Check your inbox', `We sent a link to ${user.email} to set a new password.`);
    } catch (e) {
      Alert.alert('Something went wrong', authErrorMessage(e));
    }
  };

  // A copy of everything we hold, shared as JSON (proof images left out for size).
  const download = () => {
    const { refundBank, ...rest } = profile ?? ({} as any);
    const data = {
      profile: { ...rest, refundBank: refundBank ? { ...refundBank, accountNumber: `••••${String(refundBank.accountNumber).slice(-4)}` } : undefined },
      bookings: tickets.map(({ proofOfPayment, ...t }) => ({ ...t, proofOfPayment: proofOfPayment ? '[image on file]' : '' })),
      exportedAt: new Date().toISOString(),
    };
    Share.share({ title: 'My &FRIENDS data', message: JSON.stringify(data, null, 2) });
  };

  return (
    <Screen>
      <TopBar />
      <H1 size={52}>Privacy &amp;{'\n'}security</H1>
      <SectionLabel>SECURITY</SectionLabel>
      <ListGroup>
        <ListRow icon="key-outline" title="Change password" subtitle="We'll email you a secure link" chevron onPress={changePassword} />
      </ListGroup>
      <SectionLabel>PRIVACY</SectionLabel>
      <ListGroup>
        <ToggleRow title={'Show me in "friends going"'} subtitle="On event pages" value={prefs.showInFriendsGoing} onChange={(v) => prefsStore.set({ showInFriendsGoing: v })} />
      </ListGroup>
      <SectionLabel>WHERE YOU'RE LOGGED IN</SectionLabel>
      <ListGroup>
        <ListRow icon="phone-portrait-outline" iconBg={night.lime} title="This phone" subtitle={user?.metadata.lastSignInTime ? `Last sign-in ${new Date(user.metadata.lastSignInTime).toLocaleDateString('en-ZA')}` : undefined} right={<Pill label="This device" />} />
      </ListGroup>
      <SectionLabel>YOUR DATA</SectionLabel>
      <ListGroup>
        <ListRow icon="download-outline" title="Download my data" subtitle="A copy of everything we hold on you" chevron onPress={download} />
        <ListRow icon="trash-outline" title="Delete account" danger chevron onPress={() => router.push('/settings/delete')} />
      </ListGroup>
    </Screen>
  );
}
