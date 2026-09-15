import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { getUserProfile, updateUserProfile } from '../../src/services/userService';
import { logoutUser } from '../../src/services/authService';
import SaveButton from '../../src/components/SaveButton';
import TimedUndoRow from '../../src/components/TimedUndoRow';
import { colors } from '../../src/styles/shared';

function SettingsRow({ label, value, editing, onChangeText, onPressEdit }: any) {
  return (
    <TouchableOpacity style={styles.row} activeOpacity={editing ? 1 : 0.6} onPress={!editing ? onPressEdit : undefined}>
      <Text style={styles.rowLabel}>{label}</Text>
      {editing ? (
        <TextInput style={styles.rowInput} value={value} onChangeText={onChangeText} autoFocus />
      ) : (
        <Text style={styles.rowValue}>{value}</Text>
      )}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [draft, setDraft] = useState<any>({});

  useEffect(() => {
    if (!user) return;
    getUserProfile(user.uid).then((data) => {
      setProfile(data);
      setDraft(data ?? {});
      setLoading(false);
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    await updateUserProfile(user.uid, {
      name: draft.name,
      phone: draft.phone,
      dob: draft.dob,
    });
    setProfile(draft);
    setEditingField(null);
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#1A1A1A" /></View>;
  }

  const hasChanges = JSON.stringify(profile) !== JSON.stringify(draft);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.headline}>Profile</Text>

      <Text style={styles.sectionLabel}>ACCOUNT</Text>
      <View style={styles.card}>
        <View style={styles.rowStatic}>
          <Text style={styles.rowLabel}>Email</Text>
          <Text style={styles.rowValueMuted}>{user?.email}</Text>
        </View>
        <View style={styles.divider} />
        <SettingsRow
          label="Full Name"
          value={draft.name}
          editing={editingField === 'name'}
          onChangeText={(t: string) => setDraft({ ...draft, name: t })}
          onPressEdit={() => setEditingField('name')}
        />
        <View style={styles.divider} />
        <SettingsRow
          label="Phone"
          value={draft.phone}
          editing={editingField === 'phone'}
          onChangeText={(t: string) => setDraft({ ...draft, phone: t })}
          onPressEdit={() => setEditingField('phone')}
        />
        <View style={styles.divider} />
        <SettingsRow
          label="Date of Birth"
          value={draft.dob}
          editing={editingField === 'dob'}
          onChangeText={(t: string) => setDraft({ ...draft, dob: t })}
          onPressEdit={() => setEditingField('dob')}
        />
        <View style={styles.divider} />
        <View style={styles.rowStatic}>
          <Text style={styles.rowLabel}>Account Type</Text>
          <Text style={styles.rowValueMuted}>{profile?.role}</Text>
        </View>
      </View>

      {hasChanges && (
        <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
          <SaveButton onSave={handleSave} />
        </View>
      )}

      <Text style={styles.sectionLabel}>SESSION</Text>
      <View style={styles.card}>
        <TimedUndoRow
          label="Sign Out"
          countingLabel={(s) => `Signing out in ${s}s...`}
          seconds={5}
          onConfirm={logoutUser}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headline: { fontFamily: 'BebasNeue', fontSize: 36, color: colors.textPrimary, paddingHorizontal: 16, paddingTop: 60, marginBottom: 16 },
  sectionLabel: {
    fontFamily: 'Inter-SemiBold', fontSize: 12, letterSpacing: 1,
    color: colors.textMuted, marginHorizontal: 16, marginTop: 20, marginBottom: 8,
  },
  card: { backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  rowStatic: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  rowLabel: { fontFamily: 'Inter', fontSize: 15, color: colors.textPrimary },
  rowValue: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: colors.textMuted },
  rowValueMuted: { fontFamily: 'Inter', fontSize: 14, color: colors.textMuted },
  rowInput: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: colors.textPrimary, textAlign: 'right', flex: 1, marginLeft: 20 },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginLeft: 16 },
});