import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { T, H2, Sheet, Field, ListGroup, ToggleRow, PrimaryButton } from '../../src/components/night';
import { useTicket } from '../../src/hooks/useTicket';
import { useAuth } from '../../src/context/AuthContext';
import { rejectTicket } from '../../src/services/ticketService';
import { REJECT_REASONS, rejectMessage } from '../../src/lib/staff';
import { night } from '../../src/theme/night';

// Sheet: why the proof is being sent back, with a message to the guest.
export default function RejectSheet() {
  const { ticketId, reason: initial } = useLocalSearchParams<{ ticketId: string; reason?: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { ticket } = useTicket(ticketId);
  const [reason, setReason] = useState(initial ?? REJECT_REASONS[1]);
  const [message, setMessage] = useState('');
  const [keepHeld, setKeepHeld] = useState(true);
  const [sending, setSending] = useState(false);
  const first = ticket?.userName?.split(' ')[0] ?? 'the guest';

  useEffect(() => {
    if (ticket) setMessage(rejectMessage(reason, ticket.totalPrice, ticket.id));
  }, [reason, ticket?.id]);

  const send = async () => {
    if (!user || !ticket) return;
    setSending(true);
    try {
      await rejectTicket(ticket.id, user.uid, { reason, message: message.trim(), keepHeld });
      router.dismissTo('/staff/approvals');
    } finally {
      setSending(false);
    }
  };

  return (
    <Sheet footer={<PrimaryButton tone="danger" label={`Send back to ${first}`} arrow={false} center loading={sending} disabled={!message.trim()} onPress={send} />}>
      <H2 size={36}>Why reject?</H2>
      <ListGroup>
        {REJECT_REASONS.map((r) => {
          const on = reason === r;
          return (
            <Pressable key={r} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => setReason(r)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
              <View style={{ width: 22, height: 22, borderRadius: 99, borderWidth: on ? 7 : 2, borderColor: on ? night.ink : night.handle }} />
              <T size={15} weight={on ? '600' : '400'}>{r}</T>
            </Pressable>
          );
        })}
      </ListGroup>
      <Field label={`MESSAGE TO ${first.toUpperCase()}`} value={message} onChangeText={setMessage} multiline maxLength={1000} />
      <ListGroup>
        <ToggleRow title="Keep their tickets held" subtitle="They won't have to pay again" value={keepHeld} onChange={setKeepHeld} />
      </ListGroup>
    </Sheet>
  );
}
