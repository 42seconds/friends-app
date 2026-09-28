import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { T, H1, Amp, Screen, Hero, IconButton, Avatar, Pill, ListGroup, ListRow, EmptyState, PrimaryButton, TextLink } from '../../src/components/night';
import { useProfile } from '../../src/hooks/useProfile';
import { useBookings } from '../../src/hooks/useBookings';
import { useUserRole } from '../../src/hooks/useUserRole';
import { savedStore } from '../../src/store';
import { effectiveStatus } from '../../src/services/ticketService';
import { isPast } from '../../src/lib/dates';
import { subBrandByKey } from '../../src/lib/subbrands';
import { night } from '../../src/theme/night';

function Stat({ n, label }: { n: number | string; label: string }) {
  return (
    <View style={{ flex: 1, padding: 12, borderRadius: 16, backgroundColor: night.ink2, gap: 2 }}>
      <T display size={32} color={night.paper}>{n}</T>
      <T size={12} color={night.inkMuted}>{label}</T>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, user } = useProfile();
  const { tickets } = useBookings();
  const { isAdmin } = useUserRole();
  const saved = savedStore.useStore().ids.length;

  if (!user) {
    return (
      <Screen tabBar fill contentStyle={{ justifyContent: 'center' }}>
        <EmptyState icon="person-outline" tileBg={night.blue} title="Join &Friends" body="Book tickets, save events and keep your plans in one place.">
          <PrimaryButton label="Create an account" onPress={() => router.push('/(auth)/register')} />
          <TextLink label="I already have an account" onPress={() => router.push('/(auth)/login')} />
        </EmptyState>
      </Screen>
    );
  }

  const confirmed = tickets.filter((t) => effectiveStatus(t) === 'confirmed');
  const been = new Set(confirmed.filter((t) => isPast(t.eventDate, t.eventTime) || t.checkedIn).map((t) => t.eventId)).size;
  const upcoming = confirmed.filter((t) => !isPast(t.eventDate, t.eventTime)).length;
  const pending = tickets.filter((t) => ['pending_payment', 'pending_verification', 'rejected'].includes(effectiveStatus(t))).length;
  const since = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' }) : '';
  const interests = (profile?.interests ?? []).map(subBrandByKey).filter(Boolean);

  return (
    <Screen
      tabBar
      padTop={false}
      hero={
        <Hero bg={night.ink} gap={16}>
          <Amp size={300} color={night.ink2} style={{ right: -40, top: 20 }} />
          <View style={{ alignItems: 'flex-end' }}>
            <IconButton icon="settings-outline" label="Settings" tone="dark" onPress={() => router.push('/settings')} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Avatar name={profile?.name} size={64} color={night.blue} />
            <View style={{ flex: 1 }}>
              <H1 size={40} color={night.paper}>{profile?.name ?? user.email}</H1>
              {!!since && <T size={13} color={night.inkMuted}>Member since {since}</T>}
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Stat n={been} label="Events been to" />
            <Stat n={upcoming} label="Upcoming" />
            <Stat n={saved} label="Saved" />
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            {interests.map((b) => b && <Pill key={b.key} label={b.name} bg={b.color} />)}
            <TextLink label={interests.length ? 'Edit' : 'Pick what you are into'} color={night.paper} size={13} onPress={() => router.push('/settings/edit-profile')} />
          </View>
        </Hero>
      }
    >
      <ListGroup>
        <ListRow icon="ticket-outline" iconBg={night.orange} title="My tickets" subtitle={`${upcoming} upcoming · ${pending} pending`} chevron onPress={() => router.push('/(tabs)/tickets')} />
        <ListRow icon="receipt-outline" iconBg={night.yellow} title="Purchases" subtitle="Receipts and refunds" chevron onPress={() => router.push('/receipts')} />
        <ListRow icon="people-outline" iconBg={night.blue} title="Friends" subtitle="Invite your people" chevron onPress={() => router.push('/friends')} />
        <ListRow icon="heart-outline" iconBg={night.lime} title="Saved" subtitle={`${saved} event${saved === 1 ? '' : 's'}`} chevron onPress={() => router.push('/(tabs)/saved')} />
      </ListGroup>
      {isAdmin && (
        <ListGroup>
          <ListRow icon="scan-outline" iconBg={night.ink} iconColor={night.orange} title="Staff mode" subtitle="Door scanning and payment approvals" chevron onPress={() => router.push('/staff')} />
        </ListGroup>
      )}
      <ListGroup>
        <ListRow icon="sparkles-outline" iconBg={night.ink} iconColor={night.lime} title="Host an event" subtitle="Bring your idea to our spaces" chevron onPress={() => router.push('/settings/host')} />
        <ListRow icon="help-circle-outline" title="Help and FAQ" chevron onPress={() => router.push('/settings/help')} />
        <ListRow icon="information-circle-outline" title="About &FRIENDS" chevron onPress={() => router.push('/settings/about')} />
      </ListGroup>
    </Screen>
  );
}
