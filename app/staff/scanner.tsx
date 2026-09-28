import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { T, H1, Screen, TopBar, StaffGate, PrimaryButton, OutlineButton, TextLink, IconName } from '../../src/components/night';
import { useDoorTickets } from '../../src/hooks/useStaff';
import { useProfile } from '../../src/hooks/useProfile';
import { useAuth } from '../../src/context/AuthContext';
import { checkInTicket, getTicketById, undoCheckIn } from '../../src/services/ticketService';
import { scanQueueStore } from '../../src/store';
import { clock, shortDate } from '../../src/lib/dates';
import { night } from '../../src/theme/night';
import { PurchasedTicket } from '../../src/types';

type Result =
  | { kind: 'valid'; t: PurchasedTicket; queued: boolean }
  | { kind: 'invalid'; code: string }
  | { kind: 'wrong'; t: PurchasedTicket }
  | { kind: 'unpaid'; t: PurchasedTicket }
  | { kind: 'already'; t: PurchasedTicket };

const LOOK: Record<Result['kind'], { bg: string; fg: string; icon: IconName; title: string; sub: string }> = {
  valid: { bg: night.lime, fg: night.ink, icon: 'checkmark', title: 'Valid · let them in', sub: '' },
  invalid: { bg: night.danger, fg: night.paper, icon: 'close', title: 'Not a valid ticket', sub: "Don't let them in" },
  wrong: { bg: night.yellow, fg: night.ink, icon: 'calendar', title: 'Wrong event', sub: 'This ticket is for another night' },
  unpaid: { bg: night.amber, fg: night.ink, icon: 'hourglass', title: 'Not paid yet', sub: 'Payment still being checked' },
  already: { bg: night.danger, fg: night.paper, icon: 'alert', title: 'Already scanned', sub: "Don't let them in yet" },
};

// Door scanner: every scan lands on one of five loud result states.
export default function ScannerScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { event, door, tickets, stats } = useDoorTickets();
  const { scans } = scanQueueStore.useStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<PurchasedTicket | null>(null);
  const locked = useRef(false);

  const staffName = profile?.name ?? user?.email ?? 'Staff';
  const offline = scans.length > 0;

  const handleScan = async ({ data }: { data: string }) => {
    if (locked.current || !event || !user) return;
    locked.current = true;
    setBusy(true);
    // The QR holds the raw ticket ID. Use tonight's live list first so
    // scanning keeps working on a weak signal.
    const code = data.trim();
    let t: PurchasedTicket | null = tickets.find((x) => x.id === code) ?? null;
    if (!t) t = await getTicketById(code).catch(() => null);

    const queued = scans.some((s) => s.ticketId === code);
    if (!t) setResult({ kind: 'invalid', code });
    else if (t.eventId !== event.id) setResult({ kind: 'wrong', t });
    else if (t.status !== 'confirmed') setResult({ kind: 'unpaid', t });
    else if (t.checkedIn || queued) setResult({ kind: 'already', t });
    else {
      const at = new Date().toISOString();
      try {
        await checkInTicket(t.id, { door, staffName, staffUid: user.uid });
        setResult({ kind: 'valid', t, queued: false });
      } catch {
        scanQueueStore.set((s) => ({ scans: [...s.scans, { ticketId: t!.id, guestName: t!.userName ?? '', at, door, staffName, staffUid: user.uid }] }));
        setResult({ kind: 'valid', t, queued: true });
      }
      setLast(t);
    }
    setBusy(false);
  };

  const next = () => {
    setResult(null);
    locked.current = false;
  };

  const undo = async () => {
    if (result?.kind !== 'valid' || !user) return;
    if (result.queued) scanQueueStore.set((s) => ({ scans: s.scans.filter((x) => x.ticketId !== result.t.id) }));
    else await undoCheckIn(result.t.id, user.uid, 'undo');
    setLast(null);
    next();
  };

  const look = result ? LOOK[result.kind] : null;
  const t = result && 'code' in result ? null : (result as any)?.t as PurchasedTicket | undefined;

  return (
    <StaffGate>
      <Screen bg={night.inkDeep} dark>
        <TopBar
          dark
          onBack={() => router.replace('/staff')}
          right={
            <Pressable onPress={() => router.push('/staff/door')} style={{ height: 40, paddingHorizontal: 14, borderRadius: 999, backgroundColor: night.ink2, justifyContent: 'center', maxWidth: 240 }}>
              <T size={13} weight="600" color={night.paper} numberOfLines={1}>{event ? `${event.title} · ${door}` : 'Pick an event'}</T>
            </Pressable>
          }
        />
        {offline && (
          <Pressable onPress={() => router.push('/staff/sync')} style={{ flexDirection: 'row', gap: 10, alignItems: 'center', padding: 12, borderRadius: 14, backgroundColor: night.warnDark }}>
            <Ionicons name="cloud-offline-outline" size={18} color={night.yellow} />
            <T size={13} color={night.paper} style={{ flex: 1 }}>
              <T size={13} weight="700" color={night.paper}>Offline.</T> {scans.length} scan{scans.length > 1 ? 's' : ''} saved on this phone.
            </T>
          </Pressable>
        )}
        <H1 size={44} color={night.paper}>
          Check-in <T display size={44} color={night.lime}>{stats.checkedIn}</T>
          <T display size={28} color={night.inkMuted}> / {stats.capacity}</T>
        </H1>

        <View style={{ height: 360, borderRadius: 28, overflow: 'hidden', backgroundColor: night.scanner }}>
          {!permission ? (
            <ActivityIndicator color={night.paper} style={{ flex: 1 }} />
          ) : !permission.granted ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 }}>
              <Ionicons name="camera-outline" size={44} color={night.orange} />
              <T size={15} center color={night.paper}>Camera access is needed to scan tickets.</T>
              <PrimaryButton tone="paper" label="Allow camera" arrow={false} center onPress={requestPermission} style={{ alignSelf: 'stretch' }} />
            </View>
          ) : (
            <>
              <CameraView style={StyleSheet.absoluteFill} barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={result || busy ? undefined : handleScan} />
              <View pointerEvents="none" style={{ position: 'absolute', left: 60, right: 60, top: 60, bottom: 90, borderRadius: 24, borderWidth: 3, borderColor: night.orange }} />
              <View pointerEvents="none" style={{ position: 'absolute', bottom: 28, left: 0, right: 0 }}>
                <T size={14} weight="600" color={night.paper} center>{busy ? 'Checking…' : "Point at the guest's QR code"}</T>
              </View>
            </>
          )}

          {look && result && (
            <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: look.bg, padding: 18, justifyContent: 'space-between' }} accessibilityLiveRegion="assertive">
              <View style={{ gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 52, height: 52, borderRadius: 99, backgroundColor: look.fg === night.ink ? night.ink : night.paper, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={look.icon} size={28} color={look.bg} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <T display size={32} color={look.fg}>{look.title}</T>
                    <T size={14} weight="600" color={look.fg}>{result.kind === 'valid' ? `${result.t.userName ?? 'Guest'} · ${result.t.tier}` : look.sub}</T>
                  </View>
                </View>
                <View style={{ padding: 12, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.18)' }}>
                  <T size={14} lh={1.45} color={look.fg}>
                    {result.kind === 'valid' && `${result.t.id} · admits ${result.t.quantity}${result.queued ? ' · saved offline, will sync' : ' · first scan'}`}
                    {result.kind === 'invalid' && "This code isn't an &FRIENDS ticket. It could be a screenshot of something else."}
                    {result.kind === 'wrong' && `${result.t.eventTitle} · ${shortDate(result.t.eventDate, result.t.eventTime)}. Nicely point them to the right date.`}
                    {result.kind === 'unpaid' && 'Reserved, but proof isn\'t approved. Check approvals, it might just need a tap.'}
                    {result.kind === 'already' && `${result.t.userName ?? 'Guest'} · ${result.t.tier} · ${result.t.id}. First scanned ${result.t.checkedInAt ? clock(result.t.checkedInAt) : 'earlier'}${result.t.checkedInDoor ? ` at ${result.t.checkedInDoor}` : ''}${result.t.checkedInBy ? ` by ${result.t.checkedInBy.split(' ')[0]}` : ''}.`}
                  </T>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {result.kind === 'valid' && <OutlineButton label="Undo" style={{ flex: 1, borderColor: night.ink }} onPress={undo} />}
                {result.kind === 'invalid' && <OutlineButton dark label="Guest list" style={{ flex: 1, borderColor: night.paper }} onPress={() => router.push('/staff/guestlist')} />}
                {result.kind === 'unpaid' && t && <OutlineButton label="Open payment" style={{ flex: 1, borderColor: night.ink }} onPress={() => router.push(`/staff/review/${t.id}`)} />}
                {result.kind === 'already' && t && <OutlineButton dark label="Guest details" style={{ flex: 1, borderColor: night.paper }} onPress={() => router.push(`/staff/guest/${t.id}`)} />}
                {result.kind === 'wrong' && t && <OutlineButton label="Details" style={{ flex: 1, borderColor: night.ink }} onPress={() => router.push(`/staff/guest/${t.id}`)} />}
                <PrimaryButton tone={look.fg === night.ink ? 'dark' : 'paper'} label="Scan next" arrow={false} center style={{ flex: 1, height: 52 }} onPress={next} />
              </View>
            </View>
          )}
        </View>

        {last && (
          <Pressable onPress={() => router.push(`/staff/guest/${last.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 16, backgroundColor: night.ink3 }}>
            <View style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: night.lime }} />
            <T size={14} color={night.inkMuted} style={{ flex: 1 }} numberOfLines={1}>
              Last: <T size={14} weight="600" color={night.paper}>{last.userName}</T> · {last.tier}
            </T>
            <T size={13} weight="600" color={night.paper} style={{ textDecorationLine: 'underline' }}>Details</T>
          </Pressable>
        )}
        <TextLink label="Guest list or type ID" color={night.paper} onPress={() => router.push('/staff/guestlist')} />
      </Screen>
    </StaffGate>
  );
}
