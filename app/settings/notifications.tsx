import { useProfile } from '../../src/hooks/useProfile';
import { H1, Screen, TopBar, SectionLabel, ListGroup, ListRow, ToggleRow, Pill } from '../../src/components/night';
import { prefsStore } from '../../src/store';
import { enablePushNotifications } from '../../src/lib/notifications';

export default function NotificationPrefsScreen() {
  const p = prefsStore.useStore();
  const { profile, user } = useProfile();
  const set = prefsStore.set;
  const maskedPhone = profile?.phone ? profile.phone.replace(/(\d{2})\d{3}(\d{4})$/, '$1*** $2') : 'Add a number in Edit profile';

  return (
    <Screen>
      <TopBar />
      <H1 size={52}>Notifications</H1>
      <SectionLabel>HOW WE REACH YOU</SectionLabel>
      <ListGroup>
        <ToggleRow title="Push notifications" subtitle="On this phone" value={p.push} onChange={(v) => (v ? enablePushNotifications() : set({ push: false }))} />
        <ToggleRow title="WhatsApp" subtitle={maskedPhone} value={p.whatsapp} onChange={(v) => set({ whatsapp: v })} />
        <ToggleRow title="Email" subtitle={user?.email ?? ''} value={p.email} onChange={(v) => set({ email: v })} />
      </ListGroup>
      <SectionLabel>WHAT ABOUT</SectionLabel>
      <ListGroup>
        <ListRow title="Ticket and payment updates" subtitle="Approved, needs a fix, transfers" right={<Pill label="Always on" />} />
        <ToggleRow title="Waitlist offers" subtitle="Your 30-minute claim window" value={p.waitlistOffers} onChange={(v) => set({ waitlistOffers: v })} />
        <ToggleRow title="Event reminders" subtitle="Day before and doors opening" value={p.eventReminders} onChange={(v) => set({ eventReminders: v })} />
        <ToggleRow title="Set time reminders" subtitle="From lineups you follow" value={p.setTimes} onChange={(v) => set({ setTimes: v })} />
        <ToggleRow title="Friends" subtitle="Tickets sent to you" value={p.friends} onChange={(v) => set({ friends: v })} />
        <ToggleRow title="New events" subtitle="From sub-brands you follow" value={p.newEvents} onChange={(v) => set({ newEvents: v })} />
      </ListGroup>
      <ListGroup>
        <ToggleRow title="Quiet hours" subtitle="23:00 to 08:00 · no pings, except ticket updates" value={p.quietHours} onChange={(v) => set({ quietHours: v })} />
      </ListGroup>
    </Screen>
  );
}
