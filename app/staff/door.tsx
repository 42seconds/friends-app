import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T, H1, Screen, TopBar, StaffGate, StaffPill, SectionLabel, Chip, ChipRow, Avatar, PrimaryButton } from '../../src/components/night';
import { useEvents } from '../../src/hooks/useEvents';
import { useProfile } from '../../src/hooks/useProfile';
import { staffStore } from '../../src/store';
import { relativeDay, shortDate } from '../../src/lib/dates';
import { night } from '../../src/theme/night';

const DOORS = ['Door A', 'Door B', 'VIP lane'];

// Pick the event and door this phone is scanning at.
export default function DoorPickerScreen() {
  const router = useRouter();
  const { upcoming } = useEvents();
  const { profile } = useProfile();
  const setup = staffStore.useStore();
  const selected = setup.eventId ?? upcoming[0]?.id ?? null;

  return (
    <StaffGate>
      <Screen header={<TopBar dark center={<StaffPill />} />} bg={night.ink} dark footerDark footer={<PrimaryButton tone="orange" label={`Start at ${setup.door}`} disabled={!selected} onPress={() => { staffStore.set({ eventId: selected }); router.replace('/staff/scanner'); }} />}>
        <H1 size={52} color={night.paper}>Where are{'\n'}you scanning?</H1>
        <SectionLabel dark>EVENT</SectionLabel>
        <View style={{ gap: 8 }}>
          {upcoming.slice(0, 6).map((e) => {
            const on = e.id === selected;
            return (
              <Pressable key={e.id} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => staffStore.set({ eventId: e.id })} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, backgroundColor: night.ink3, borderWidth: 2, borderColor: on ? night.orange : 'transparent' }}>
                <View style={{ width: 22, height: 22, borderRadius: 99, borderWidth: on ? 7 : 2, borderColor: on ? night.orange : night.darkLine }} />
                <View style={{ flex: 1 }}>
                  <T size={16} weight="600" color={night.paper}>{e.title}</T>
                  <T size={13} color={night.inkMuted}>{[relativeDay(e.date, e.time) ?? shortDate(e.date, e.time), e.time && `doors ${e.time}`].filter(Boolean).join(' · ')}</T>
                </View>
              </Pressable>
            );
          })}
        </View>
        <SectionLabel dark>DOOR</SectionLabel>
        <ChipRow>
          {DOORS.map((d) => (
            <Chip key={d} dark label={d} active={setup.door === d} activeColor={night.orange} onPress={() => staffStore.set({ door: d })} />
          ))}
        </ChipRow>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, backgroundColor: night.ink3 }}>
          <Avatar name={profile?.name} color={night.lime} ring={night.ink3} />
          <View style={{ flex: 1 }}>
            <T size={15} weight="600" color={night.paper}>Scanning as {profile?.name ?? 'staff'}</T>
            <T size={13} color={night.inkMuted}>Every scan is logged under your name</T>
          </View>
          <Ionicons name="shield-checkmark" size={20} color={night.lime} />
        </View>
      </Screen>
    </StaffGate>
  );
}
