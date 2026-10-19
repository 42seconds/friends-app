import { useState } from 'react';
import { Linking, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T, H2, Sheet, Field, Card, SlideToConfirm } from '../../src/components/night';
import { useTicket } from '../../src/hooks/useTicket';
import { startTransfer } from '../../src/services/ticketService';
import { whatsappLink } from '../../src/lib/booking';
import { claimUrl } from '../../src/config/payment';
import { shortDate } from '../../src/lib/dates';
import { night } from '../../src/theme/night';
import { LIMITS, checkName, checkPhone, normalizePhone } from '../../src/lib/validation';

function Promise_({ children }: { children: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
      <Ionicons name="checkmark-circle" size={18} color={night.success} />
      <T size={14} style={{ flex: 1 }}>{children}</T>
    </View>
  );
}

// Sheet: send a ticket to a friend over WhatsApp. They accept through
// the link; until then it stays yours and you can cancel.
export default function SendTicketSheet() {
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
  const router = useRouter();
  const { ticket } = useTicket(ticketId);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const ready = !checkName(name, "friend's name") && !checkPhone(phone, true);
  // Only complain about the number once it's long enough to judge.
  const phoneError = phone.replace(/\D/g, '').length >= 9 ? checkPhone(phone, true) : null;

  const send = async () => {
    if (!ticket || !ready) return;
    setError('');
    try {
      await startTransfer(ticket.id, name.trim(), normalizePhone(phone));
      const msg = `${name.trim().split(' ')[0]}, I'm sending you a ticket for ${ticket.eventTitle} (${shortDate(ticket.eventDate, ticket.eventTime)}). Accept it here: ${claimUrl(ticket.id)}`;
      Linking.openURL(whatsappLink(msg, normalizePhone(phone)));
      router.replace(`/ticket/transfer?ticketId=${ticket.id}`);
    } catch {
      setError("Couldn't send right now. Check your connection and try again.");
    }
  };

  return (
    <Sheet footer={<SlideToConfirm label="Slide to send" onConfirm={send} disabled={!ready} />}>
      <H2 size={36}>Send a ticket</H2>
      <T size={14} lh={1.5} color={night.body}>Your friend gets a link on WhatsApp. They don't need the app to accept.</T>
      <Field label="FRIEND'S NAME" value={name} onChangeText={setName} placeholder="e.g. Thabo Mokoena" autoCapitalize="words" maxLength={LIMITS.name} />
      <Field label="THEIR WHATSAPP NUMBER" value={phone} onChangeText={setPhone} placeholder="082 000 0000" keyboardType="phone-pad" maxLength={LIMITS.phone} error={error || phoneError || undefined} />
      <Card pad={14}>
        <Promise_>{`The ticket stays yours until ${name.trim().split(' ')[0] || 'they'} accept${name.trim() ? 's' : ''}`}</Promise_>
        <Promise_>Cancel any time before then</Promise_>
        {(ticket?.quantity ?? 1) > 1 && <Promise_>Your other tickets aren't affected</Promise_>}
      </Card>
    </Sheet>
  );
}
