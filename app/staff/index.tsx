import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T, H1, Screen, TopBar, StaffGate, StaffPill, PrimaryButton, EmptyState, IconName } from '../../src/components/night';
import { useDoorTickets } from '../../src/hooks/useStaff';
import { scanQueueStore } from '../../src/store';
import { night } from '../../src/theme/night';

function Tile({ n, label, bg = night.ink2, fg = night.paper, onPress }: { n: number; label: string; bg?: string; fg?: string; onPress?: () => void }) {
  return (
    <Pressable disabled={!onPress} onPress={onPress} style={{ flex: 1, padding: 14, borderRadius: 18, backgroundColor: bg, gap: 2 }}>
      <T display size={36} color={fg}>{n}</T>
      <T size={12} color={fg === night.paper ? night.inkMuted : fg}>{label}</T>
    </Pressable>
  );
}

function Link({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={{ flex: 1, height: 56, borderRadius: 16, backgroundColor: night.ink2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <Ionicons name={icon} size={18} color={night.orange} />
      <T size={14} weight="600" color={night.paper}>{label}</T>
    </Pressable>
  );
}

// Tonight dashboard: who's in, arrivals, what needs reviewing.
export default function StaffHomeScreen() {
  const router = useRouter();
  const { event, door, tickets, stats } = useDoorTickets();
  const { scans } = scanQueueStore.useStore();

  // Arrivals per 5 minutes over the last hour.
  const now = Date.now();
  const buckets = Array.from({ length: 12 }, (_, i) => tickets.filter((t) => t.checkedIn && t.checkedInAt && now - new Date(t.checkedInAt).getTime() < (12 - i) * 300000 && now - new Date(t.checkedInAt).getTime() >= (11 - i) * 300000).reduce((n, t) => n + (t.quantity || 1), 0));
  const peak = Math.max(1, ...buckets);
  const last15 = buckets.slice(-3).reduce((a, b) => a + b, 0);
  const pct = stats.capacity ? Math.min(1, stats.checkedIn / stats.capacity) : 0;

  return (
    <StaffGate>
      <Screen bg={night.ink} dark footerDark footer={event ? <PrimaryButton tone="orange" icon="scan" label="Start scanning" onPress={() => router.push('/staff/scanner')} /> : undefined}>
        <TopBar
          dark
          icon="close"
          onBack={() => router.replace('/(tabs)/profile')}
          center={<StaffPill />}
          right={
            <Pressable onPress={() => router.push('/staff/sync')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 12, borderRadius: 999, backgroundColor: night.ink2 }}>
              <View style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: scans.length ? night.yellow : night.lime }} />
              <T size={13} weight="600" color={night.paper}>{scans.length ? `${scans.length} to sync` : 'Synced'}</T>
            </Pressable>
          }
        />
        {!event ? (
          <EmptyState dark icon="calendar-outline" tileBg={night.ink2} iconColor={night.orange} title="No event tonight" body="There are no upcoming published events to work." />
        ) : (
          <>
            <Pressable accessibilityRole="button" onPress={() => router.push('/staff/door')} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <T mono weight="700" size={11} color={night.inkMuted}>{`TONIGHT · ${door}`.toUpperCase()}</T>
                <H1 size={48} color={night.paper}>{event.title}</H1>
              </View>
              <View style={{ width: 40, height: 40, borderRadius: 99, backgroundColor: night.ink2, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="swap-horizontal" size={18} color={night.paper} />
              </View>
            </Pressable>

            <View style={{ padding: 16, borderRadius: 22, backgroundColor: night.ink3, gap: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <View>
                  <T size={13} color={night.inkMuted}>Checked in</T>
                  <T display size={64} color={night.paper}>
                    {stats.checkedIn}<T display size={28} color={night.inkMuted}> / {stats.capacity}</T>
                  </T>
                </View>
                <T mono weight="700" size={11} color={night.lime}>+{last15} LAST 15 MIN</T>
              </View>
              <View style={{ height: 8, borderRadius: 99, backgroundColor: night.ink2, overflow: 'hidden' }}>
                <View style={{ width: `${pct * 100}%`, height: 8, backgroundColor: night.lime }} />
              </View>
              <T size={12} color={night.inkMuted}>Arrivals, last hour</T>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 48 }} accessibilityLabel={`${buckets.reduce((a, b) => a + b, 0)} arrivals in the last hour`}>
                {buckets.map((b, i) => (
                  <View key={i} style={{ flex: 1, height: Math.max(4, (b / peak) * 48), borderRadius: 3, backgroundColor: i === buckets.length - 1 ? night.orange : '#4A3A2E' }} />
                ))}
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Tile n={stats.sold} label="Sold" />
              <Tile n={stats.verified} label="Verified" />
              <Tile n={stats.toReview} label="To review" bg={stats.toReview ? night.orange : night.ink2} fg={stats.toReview ? night.ink : night.paper} onPress={() => router.push('/staff/approvals')} />
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Link icon="list" label="Guest list" onPress={() => router.push('/staff/guestlist')} />
              <Link icon="checkmark-done" label="Approvals" onPress={() => router.push('/staff/approvals')} />
            </View>
          </>
        )}
      </Screen>
    </StaffGate>
  );
}
