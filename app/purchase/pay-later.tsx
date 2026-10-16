import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { T, H1, Screen, TopBar, PrimaryButton, TextLink, ListGroup, ToggleRow, FirstTicketTracker, HideGuideLink } from '../../src/components/night';
import { useTicket } from '../../src/hooks/useTicket';
import { useFirstTicketGuide } from '../../src/hooks/useFirstTicketGuide';
import { holdEndsAt } from '../../src/services/ticketService';
import { scheduleReminder } from '../../src/lib/notifications';
import { REMINDERS, ReminderKey, reminderTimes } from '../../src/lib/reminders';
import { night } from '../../src/theme/night';

function holdLabel(ms: number) {
  if (!Number.isFinite(ms)) return 'the hold ends';
  return new Date(ms).toLocaleString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// "No rush. We'll remind you": pick reminders on this phone before the
// hold runs out. The booking waits in Tickets > Pending.
export default function PayLaterScreen() {
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
  const router = useRouter();
  const { ticket, loading } = useTicket(ticketId);
  const guide = useFirstTicketGuide();
  const [on, setOn] = useState<Record<ReminderKey, boolean>>({ in2h: true, before6h: true, before1h: false });
  const [saving, setSaving] = useState(false);

  if (loading || !ticket) return <View style={{ flex: 1, justifyContent: 'center', backgroundColor: night.paper }}><ActivityIndicator color={night.ink} /></View>;

  const end = holdEndsAt(ticket);
  const url = `/purchase/pay?ticketId=${ticket.id}`;

  const done = async () => {
    setSaving(true);
    const keys = (Object.keys(on) as ReminderKey[]).filter((k) => on[k]);
    for (const r of reminderTimes(keys, Date.now(), end)) {
      await scheduleReminder(
        new Date(r.at),
        r.key === 'before1h' ? 'Last call for your tickets' : 'Your tickets are still held',
        `Pay by EFT for ${ticket.eventTitle} with reference ${ticket.id}, then upload your proof.`,
        url
      );
    }
    setSaving(false);
    router.replace('/(tabs)/tickets');
  };

  return (
    <Screen
      header={<><TopBar right={guide ? <HideGuideLink /> : undefined} center={<T size={15} weight="600">Pay later</T>} />{guide && <FirstTicketTracker step={3} />}</>}
      footer={
        <>
          <PrimaryButton label="Done, set reminders" loading={saving} onPress={done} />
          <TextLink label="Actually, I'll pay now" muted onPress={() => router.replace(url as any)} />
        </>
      }
    >
      <H1 size={56}>No rush.{'\n'}We'll remind you</H1>
      <T size={15} lh={1.5} color={night.body}>
        Your tickets are held until <T size={15} weight="700">{holdLabel(end)}</T>. Pick up where you left off from <T size={15} weight="700">Tickets › Pending</T>.
      </T>

      <ListGroup>
        {REMINDERS.map((r) => (
          <ToggleRow key={r.key} title={r.title} subtitle={r.sub} value={on[r.key]} onChange={(v) => setOn((s) => ({ ...s, [r.key]: v }))} />
        ))}
      </ListGroup>

      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', padding: 14, borderRadius: 18, backgroundColor: night.ink }}>
        <T mono weight="700" size={12} color={night.lime}>SAVED</T>
        <T size={13} lh={1.4} color={night.paper} style={{ flex: 1 }}>
          Your reference <T mono weight="700" size={13} color={night.paper}>{ticket.id}</T> is saved on this booking.
        </T>
      </View>
    </Screen>
  );
}
