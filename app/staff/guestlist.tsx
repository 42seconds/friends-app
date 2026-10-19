import { useState } from 'react';
import { Alert, Pressable, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T, H1, Screen, TopBar, StaffGate, Chip, Avatar, ListGroup } from '../../src/components/night';
import { useDoorTickets } from '../../src/hooks/useStaff';
import { useProfile } from '../../src/hooks/useProfile';
import { checkInTicket } from '../../src/services/ticketService';
import { clock } from '../../src/lib/dates';
import { fonts, night } from '../../src/theme/night';

type Filter = 'all' | 'in' | 'out';

// Search tonight's guests, check people in by hand, or type a ticket ID.
export default function GuestListScreen() {
  const router = useRouter();
  const { profile, user } = useProfile();
  const { tickets, door } = useDoorTickets();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [typedId, setTypedId] = useState('');

  const confirmed = tickets.filter((t) => t.status === 'confirmed');
  const inCount = confirmed.filter((t) => t.checkedIn).length;
  const query = q.trim().toLowerCase();
  const shown = confirmed
    .filter((t) => (filter === 'all' ? true : filter === 'in' ? t.checkedIn : !t.checkedIn))
    .filter((t) => !query || [t.userName, t.id, t.userEmail].some((s) => s?.toLowerCase().includes(query)))
    .sort((a, b) => (a.userName ?? '').localeCompare(b.userName ?? ''));

  const checkIn = (id: string) => user && checkInTicket(id, { door, staffName: profile?.name ?? 'Staff', staffUid: user.uid }).catch(() => Alert.alert('No signal', 'Try again, or scan the QR.'));

  const lookUp = () => {
    const id = typedId.trim().toUpperCase();
    const full = id.startsWith('TKT-') ? id : `TKT-${id}`;
    const t = tickets.find((x) => x.id === full);
    if (t) router.push(`/staff/guest/${t.id}`);
    else Alert.alert('Not on tonight\'s list', `${full} isn't a ticket for this event.`);
  };

  return (
    <StaffGate>
      <Screen header={<TopBar dark right={<T mono weight="700" size={11} color={night.inkMuted}>{door.toUpperCase()}</T>} />} bg={night.ink} dark>
        <H1 size={52} color={night.paper}>Guest list</H1>
        <View style={{ height: 52, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, borderRadius: 14, backgroundColor: night.ink3 }}>
          <Ionicons name="search" size={18} color={night.inkMuted} />
          <TextInput accessibilityLabel="Search guests" value={q} onChangeText={setQ} placeholder="Name or ticket ID" placeholderTextColor={night.faint} style={{ flex: 1, fontFamily: fonts.regular, fontSize: 16, color: night.paper }} />
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip dark label={`All · ${confirmed.length}`} active={filter === 'all'} onPress={() => setFilter('all')} />
          <Chip dark label={`In · ${inCount}`} active={filter === 'in'} onPress={() => setFilter('in')} />
          <Chip dark label={`Not in · ${confirmed.length - inCount}`} active={filter === 'out'} onPress={() => setFilter('out')} />
        </View>
        <ListGroup dark>
          {shown.map((t) => (
            <Pressable key={t.id} onPress={() => router.push(`/staff/guest/${t.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 }}>
              <Avatar name={t.userName} size={40} ring={night.ink3} />
              <View style={{ flex: 1 }}>
                <T size={15} weight="600" color={night.paper}>{t.userName ?? 'Guest'}</T>
                <T size={12} mono color={night.inkMuted}>{t.quantity > 1 ? `${t.quantity} × ` : ''}{t.tier} · {t.id}</T>
              </View>
              {t.checkedIn ? (
                <T size={13} weight="600" color={night.lime}>In · {clock(t.checkedInAt)}</T>
              ) : (
                <Pressable accessibilityRole="button" onPress={() => checkIn(t.id)} style={{ height: 36, paddingHorizontal: 14, borderRadius: 999, backgroundColor: night.orange, justifyContent: 'center' }}>
                  <T size={13} weight="700">Check in</T>
                </Pressable>
              )}
            </Pressable>
          ))}
        </ListGroup>
        {!shown.length && <T size={14} color={night.inkMuted} center>No guests match.</T>}
        <View style={{ padding: 14, borderRadius: 18, backgroundColor: night.ink3, gap: 10 }}>
          <T size={14} weight="600" color={night.paper}>QR won't scan? Type the ticket ID</T>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 52, paddingLeft: 14, paddingRight: 6, borderRadius: 14, backgroundColor: night.ink }}>
            <T mono weight="700" size={16} color={night.inkMuted}>TKT-</T>
            <TextInput accessibilityLabel="Ticket ID" value={typedId} onChangeText={setTypedId} autoCapitalize="characters" placeholder="8492AXL5" placeholderTextColor={night.faint} onSubmitEditing={lookUp} style={{ flex: 1, fontFamily: fonts.mono, fontSize: 16, color: night.paper }} />
            <Pressable accessibilityRole="button" onPress={lookUp} style={{ height: 40, paddingHorizontal: 16, borderRadius: 10, backgroundColor: night.orange, justifyContent: 'center' }}>
              <T size={14} weight="700">Check</T>
            </Pressable>
          </View>
        </View>
      </Screen>
    </StaffGate>
  );
}
