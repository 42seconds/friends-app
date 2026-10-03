import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T, H1, Screen, Hero, TopBar, StaffGate, Card, SectionLabel, Chip, ChipRow, Pill, PrimaryButton, OutlineButton, IconButton } from '../../../src/components/night';
import { useTicket } from '../../../src/hooks/useTicket';
import { useAuth } from '../../../src/context/AuthContext';
import { approveTicket, holdEndsAt, listenToTicketsByStatus } from '../../../src/services/ticketService';
import { ago, stamp } from '../../../src/lib/dates';
import { rand } from '../../../src/lib/pricing';
import { night } from '../../../src/theme/night';
import { PurchasedTicket } from '../../../src/types';
import { REJECT_REASONS } from '../../../src/lib/staff';


function CheckRow({ on, onToggle, label, value }: { on: boolean; onToggle: () => void; label: string; value: string }) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={onToggle} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
      <View style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: on ? night.ink : night.card, borderWidth: on ? 0 : 1.5, borderColor: night.border, alignItems: 'center', justifyContent: 'center' }}>
        {on && <Ionicons name="checkmark" size={16} color={night.lime} />}
      </View>
      <T size={14} style={{ flex: 1 }}>{label}</T>
      <T mono weight="700" size={13}>{value}</T>
    </Pressable>
  );
}

// Staff: compare the proof with the booking, then approve or send back.
export default function ProofReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { ticket: t, loading } = useTicket(id);
  const [queue, setQueue] = useState<PurchasedTicket[]>([]);
  const [checks, setChecks] = useState({ amount: false, ref: false, hold: false });
  const [reason, setReason] = useState<string | null>(null);
  const [zoom, setZoom] = useState(false);
  const [approving, setApproving] = useState(false);

  useEffect(() => listenToTicketsByStatus('pending_verification', setQueue), []);
  useEffect(() => {
    setChecks({ amount: false, ref: false, hold: false });
    setReason(null);
  }, [id]);

  if (loading || !t) return <View style={{ flex: 1, justifyContent: 'center', backgroundColor: night.paper }}><ActivityIndicator color={night.ink} /></View>;

  const idx = queue.findIndex((x) => x.id === t.id);
  const nextId = queue.find((x) => x.id !== t.id)?.id;
  const allChecked = checks.amount && checks.ref && checks.hold;
  const reviewable = t.status === 'pending_verification';

  const approve = async () => {
    if (!user) return;
    setApproving(true);
    try {
      await approveTicket(t.id, user.uid);
      if (nextId) router.replace(`/staff/review/${nextId}`);
      else router.replace('/staff/approvals');
    } finally {
      setApproving(false);
    }
  };

  return (
    <StaffGate>
      <Screen header={<TopBar dark onBack={() => router.replace('/staff/approvals')} center={<T mono weight="700" size={11} color={night.inkMuted}>{idx >= 0 ? `${idx + 1} OF ${queue.length} TO REVIEW` : String(t.status ?? 'unknown').replace('_', ' ').toUpperCase()}</T>} />} headerBg={night.ink}
        padTop={false}
        footer={
          reviewable ? (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <OutlineButton label="Reject" style={{ flex: 1 }} height={58} onPress={() => router.push(`/staff/reject?ticketId=${t.id}${reason ? `&reason=${encodeURIComponent(reason)}` : ''}`)} />
              <PrimaryButton label={nextId ? 'Approve and next' : 'Approve'} icon="checkmark" arrow={false} center loading={approving} disabled={!allChecked} style={{ flex: 2 }} onPress={approve} />
            </View>
          ) : undefined
        }
        hero={
          <Hero bg={night.ink} gap={12}>
            <H1 size={40} color={night.paper}>{t.userName ?? 'Guest'}</H1>
            <T size={14} color={night.inkMuted}>{t.eventTitle} · {t.quantity} × {t.tier} · uploaded {ago(t.proofUploadedAt ?? t.createdAt)} ago</T>
          </Hero>
        }
      >
        <Pressable accessibilityRole="imagebutton" accessibilityLabel="Zoom proof of payment" onPress={() => t.proofOfPayment && setZoom(true)} style={{ height: 300, borderRadius: 20, backgroundColor: '#E2DDD1', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
          {t.proofOfPayment ? <Image source={{ uri: t.proofOfPayment }} style={{ width: '100%', height: '100%' }} resizeMode="contain" /> : <T size={14} color={night.muted}>No proof uploaded yet</T>}
          {!!t.proofOfPayment && (
            <View style={{ position: 'absolute', right: 12, bottom: 12, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 36, borderRadius: 999, backgroundColor: night.ink }}>
              <Ionicons name="expand" size={14} color={night.paper} />
              <T size={13} weight="600" color={night.paper}>Zoom</T>
            </View>
          )}
        </Pressable>

        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <T mono weight="700" size={11} color={night.muted}>CHECK AGAINST PROOF</T>
            <Pill label={`${[checks.amount, checks.ref, checks.hold].filter(Boolean).length} of 3`} bg={allChecked ? night.successBg : night.sand} color={allChecked ? night.success : night.ink} />
          </View>
          <CheckRow on={checks.amount} onToggle={() => setChecks((c) => ({ ...c, amount: !c.amount }))} label="Amount is" value={rand(t.totalPrice)} />
          <CheckRow on={checks.ref} onToggle={() => setChecks((c) => ({ ...c, ref: !c.ref }))} label="Reference is" value={t.id} />
          <CheckRow on={checks.hold} onToggle={() => setChecks((c) => ({ ...c, hold: !c.hold }))} label="Paid within hold" value={`by ${stamp(new Date(holdEndsAt(t)).toISOString())}`} />
        </Card>

        {reviewable && (
          <>
            <SectionLabel>IF REJECTING, TELL THEM WHY</SectionLabel>
            <ChipRow>
              {REJECT_REASONS.map((r) => (
                <Chip key={r} label={r} active={reason === r} onPress={() => setReason(reason === r ? null : r)} />
              ))}
            </ChipRow>
          </>
        )}

        <Modal visible={zoom} transparent animationType="fade" onRequestClose={() => setZoom(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(14,13,11,0.96)', justifyContent: 'center' }}>
            <Image source={{ uri: t.proofOfPayment }} style={{ width: '100%', height: '85%' }} resizeMode="contain" />
            <View style={{ position: 'absolute', top: 60, right: 20 }}>
              <IconButton icon="close" label="Close" tone="dark" onPress={() => setZoom(false)} />
            </View>
          </View>
        </Modal>
      </Screen>
    </StaffGate>
  );
}
