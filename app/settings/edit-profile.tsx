import { useEffect, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T, H1, Screen, TopBar, Avatar, Field, SectionLabel, PrimaryButton } from '../../src/components/night';
import { useProfile } from '../../src/hooks/useProfile';
import { updateUserProfile } from '../../src/services/userService';
import { SUB_BRANDS } from '../../src/lib/subbrands';
import { night } from '../../src/theme/night';

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, user } = useProfile();
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [phone, setPhone] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const [f, ...rest] = (profile.name ?? '').split(' ');
    setFirst(f ?? '');
    setLast(rest.join(' '));
    setPhone(profile.phone ?? '');
    setInterests(profile.interests ?? []);
  }, [profile]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile(user.uid, { name: [first.trim(), last.trim()].filter(Boolean).join(' '), phone: phone.trim(), interests });
      router.back();
    } catch {
      Alert.alert("Couldn't save", 'Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen header={<TopBar />} footer={<PrimaryButton label="Save changes" loading={saving} disabled={!first.trim()} onPress={save} />}>
      <H1 size={56}>Edit profile</H1>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Avatar name={`${first} ${last}`} size={72} color={night.blue} />
        <T size={13} color={night.muted} style={{ flex: 1 }}>Your initials show on tickets you send to friends.</T>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Field label="FIRST NAME" value={first} onChangeText={setFirst} autoCapitalize="words" />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="LAST NAME" value={last} onChangeText={setLast} autoCapitalize="words" />
        </View>
      </View>
      <Field
        label="EMAIL"
        value={user?.email ?? ''}
        editable={false}
        right={
          user?.emailVerified ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="checkmark-circle" size={16} color={night.success} />
              <T size={12} weight="700" color={night.success}>Verified</T>
            </View>
          ) : undefined
        }
        hint="Your email is your login, so it can't be changed here."
      />
      <Field label="PHONE" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <SectionLabel>WHAT YOU'RE INTO</SectionLabel>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {SUB_BRANDS.map((b) => {
          const on = interests.includes(b.key);
          return (
            <Pressable key={b.key} accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={() => setInterests((xs) => (on ? xs.filter((x) => x !== b.key) : [...xs, b.key]))} style={{ height: 40, paddingHorizontal: 14, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: on ? b.color : night.card, borderWidth: on ? 2 : 1.5, borderColor: on ? night.ink : night.border }}>
              <T display size={18}>{b.name}</T>
              {on && <Ionicons name="checkmark" size={16} color={night.ink} />}
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
