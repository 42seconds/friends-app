import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { getUserProfile, updateUserProfile } from '../../src/services/userService';
import { logoutUser } from '../../src/services/authService';
import { UserProfile } from '../../src/types';

export default function ProfileScreen() {
  const { user } = useAuth();

  // Holds the live-loaded profile fields from Firestore.
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Separate editable copies so typing doesn't mutate `profile`
  // directly — only committed to Firestore (and to `profile`) on Save.
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load the profile once we know who's logged in.
  useEffect(() => {
    if (!user) return;
    (async () => {
      const data = await getUserProfile(user.uid);
      if (data) {
        setProfile(data);
        setName(data.name);
        setPhone(data.phone);
        setDob(data.dob);
      }
      setLoading(false);
    })();
  }, [user]);

  // Writes the edited fields back to Firestore, then updates local
  // state so the screen reflects the change without needing a refetch.
  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile(user.uid, { name, phone, dob });
      setProfile((prev) => (prev ? { ...prev, name, phone, dob } : prev));
      setEditing(false);
    } catch (err) {
      Alert.alert('Update failed', 'Could not save your changes. Try again.');
    } finally {
      setSaving(false);
    }
  };

  // Cancel just reverts the input fields back to the last saved values,
  // discarding whatever was typed.
  const handleCancel = () => {
    if (profile) {
      setName(profile.name);
      setPhone(profile.phone);
      setDob(profile.dob);
    }
    setEditing(false);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#C1502E" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Profile</Text>

      {/* Email shown but never editable — it's tied to the Auth account. */}
      <View style={styles.field}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.readOnlyValue}>{user?.email}</Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Full Name</Text>
        {editing ? (
          <TextInput style={styles.input} value={name} onChangeText={setName} />
        ) : (
          <Text style={styles.value}>{profile?.name}</Text>
        )}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Phone Number</Text>
        {editing ? (
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        ) : (
          <Text style={styles.value}>{profile?.phone}</Text>
        )}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Date of Birth</Text>
        {editing ? (
          <TextInput
            style={styles.input}
            value={dob}
            onChangeText={setDob}
            placeholder="YYYY-MM-DD"
          />
        ) : (
          <Text style={styles.value}>{profile?.dob}</Text>
        )}
      </View>

      {/* Role shown for transparency, never editable — always "resident"
          for mobile-registered users, per the app's scope. */}
      <View style={styles.field}>
        <Text style={styles.label}>Account Type</Text>
        <Text style={styles.readOnlyValue}>{profile?.role}</Text>
      </View>

      {editing ? (
        <View style={styles.editRow}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleCancel}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.button} onPress={() => setEditing(true)}>
          <Text style={styles.buttonText}>Edit Profile</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.signOutButton} onPress={logoutUser}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 24, paddingBottom: 48 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  header: { fontSize: 28, fontWeight: 'bold', color: '#000000', marginBottom: 24 },
  field: { marginBottom: 18 },
  label: { fontSize: 13, color: '#888888', marginBottom: 4, textTransform: 'uppercase' },
  value: { fontSize: 16, color: '#000000' },
  readOnlyValue: { fontSize: 16, color: '#555555' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: '#000000',
    backgroundColor: '#FFFFFF',
  },
  button: {
    backgroundColor: '#C1502E',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  editRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  saveButton: { flex: 1, marginTop: 0 },
  cancelButton: { flex: 1, marginTop: 0, backgroundColor: '#eee' },
  cancelButtonText: { color: '#000000', fontWeight: '600', fontSize: 15 },
  signOutButton: { marginTop: 32, alignItems: 'center' },
  signOutText: { color: '#B23A2E', fontWeight: '600', fontSize: 15 },
});