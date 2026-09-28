import { useState } from 'react';
import { Alert, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { T, H1, Screen, TopBar, StaffGate, StaffPill, ListGroup, ListRow, PrimaryButton, Note } from '../../src/components/night';
import { scanQueueStore } from '../../src/store';
import { syncQueuedScans } from '../../src/hooks/useStaff';
import { clock } from '../../src/lib/dates';
import { night } from '../../src/theme/night';

// Offline scans waiting to reach the server.
export default function OfflineSyncScreen() {
  const { scans, lastSyncedAt } = scanQueueStore.useStore();
  const [syncing, setSyncing] = useState(false);

  const sync = async () => {
    setSyncing(true);
    const done = await syncQueuedScans();
    setSyncing(false);
    const left = scanQueueStore.get().scans.length;
    Alert.alert(left ? 'Still offline' : 'All synced', left ? `${done} synced, ${left} still waiting. We'll keep them safe.` : `${done} scan${done === 1 ? '' : 's'} synced.`);
  };

  return (
    <StaffGate>
      <Screen bg={night.ink} dark footerDark footer={<PrimaryButton tone="paper" label="Try to sync now" loading={syncing} disabled={!scans.length} arrow={false} center onPress={sync} />}>
        <TopBar dark center={<StaffPill />} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: scans.length ? night.warnDark : night.ink2 }}>
          <Ionicons name={scans.length ? 'cloud-offline-outline' : 'cloud-done-outline'} size={16} color={scans.length ? night.yellow : night.lime} />
          <T mono weight="700" size={11} color={night.paper}>{scans.length ? 'WAITING FOR SIGNAL' : 'ALL SYNCED'}</T>
        </View>
        <H1 size={56} color={night.paper}>Keep scanning</H1>
        <T size={15} lh={1.5} color={night.inkMuted}>Scans made without signal are saved on this phone and sync when you tap below or when you're back online.</T>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1, padding: 14, borderRadius: 18, backgroundColor: night.ink2 }}>
            <T display size={40} color={night.paper}>{scans.length}</T>
            <T size={12} color={night.inkMuted}>Scans waiting to sync</T>
          </View>
          <View style={{ flex: 1, padding: 14, borderRadius: 18, backgroundColor: night.ink2 }}>
            <T display size={40} color={night.paper}>{lastSyncedAt ? clock(lastSyncedAt) : '—'}</T>
            <T size={12} color={night.inkMuted}>Last synced</T>
          </View>
        </View>
        {scans.length > 0 && (
          <ListGroup dark>
            {scans.slice(-8).reverse().map((s) => (
              <ListRow key={s.ticketId} dark title={s.guestName || s.ticketId} subtitle={`${clock(s.at)} · ${s.door}`} />
            ))}
          </ListGroup>
        )}
        <Note tone="warn" icon="information-circle-outline">
          <T size={13} lh={1.5} color={night.paper}>If two doors scan the same ticket while offline, the first scan wins when both sync.</T>
        </Note>
      </Screen>
    </StaffGate>
  );
}
