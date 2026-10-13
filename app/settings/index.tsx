import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { T, H1, Screen, TopBar, SectionLabel, ListGroup, ListRow } from '../../src/components/night';
import { useProfile } from '../../src/hooks/useProfile';
import { last4 } from '../../src/services/userService';
import { night } from '../../src/theme/night';

export default function SettingsScreen() {
  const router = useRouter();
  const { profile } = useProfile();

  return (
    <Screen header={<TopBar />}>
      <H1 size={56}>Settings</H1>
      <SectionLabel>ACCOUNT</SectionLabel>
      <ListGroup>
        <ListRow icon="person-outline" title="Edit profile" chevron onPress={() => router.push('/settings/edit-profile')} />
        <ListRow icon="card-outline" title="Refund bank details" subtitle={profile?.refundBank ? `Your account ····${last4(profile.refundBank.accountNumber)}` : 'Not added yet'} chevron onPress={() => router.push('/settings/bank')} />
        <ListRow icon="shield-checkmark-outline" title="Privacy and security" chevron onPress={() => router.push('/settings/privacy')} />
      </ListGroup>
      <SectionLabel>PREFERENCES</SectionLabel>
      <ListGroup>
        <ListRow icon="notifications-outline" title="Notifications" subtitle="Push, WhatsApp, email" chevron onPress={() => router.push('/settings/notifications')} />
        <ListRow icon="language-outline" title="Language" subtitle="English" chevron onPress={() => router.push('/settings/language')} />
      </ListGroup>
      <SectionLabel>SUPPORT</SectionLabel>
      <ListGroup>
        <ListRow icon="help-circle-outline" title="Help and FAQ" chevron onPress={() => router.push('/settings/help')} />
        <ListRow icon="information-circle-outline" title="About &FRIENDS" chevron onPress={() => router.push('/settings/about')} />
        <ListRow icon="document-text-outline" title="Terms and privacy" chevron onPress={() => router.push('/settings/legal')} />
      </ListGroup>
      <ListGroup>
        <ListRow icon="log-out-outline" title="Log out" chevron onPress={() => router.push('/settings/logout')} />
        <ListRow icon="trash-outline" title="Delete account" danger chevron onPress={() => router.push('/settings/delete')} />
      </ListGroup>
      <T mono size={11} color={night.faint} center>&amp;FRIENDS · VERSION {Constants.expoConfig?.version ?? ''}</T>
    </Screen>
  );
}
