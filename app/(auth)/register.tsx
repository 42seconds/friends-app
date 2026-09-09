import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { registerUser } from '../../src/services/authService';
import { cardShadow, colors } from '../../src/styles/shared';

export default function RegisterScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dob, setDob] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
     await registerUser({
  name: `${firstName} ${lastName}`.trim(),
  email,
  phone,
  dob,
  password,
});
    } catch (err) {
      setError('Could not create account. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headline}>Join{'\n'}&FRIENDS</Text>
      <Text style={styles.subtext}>
        Step into a vibrantly creative community rooted in African modernism. We are authoritative yet accessible, connecting the pulse of Johannesburg with the world.
      </Text>

      <View style={[styles.card, cardShadow(4)]}>
        <Text style={styles.cardTitle}>Create Account</Text>
        <Text style={styles.cardSubtitle}>Become part of the movement.</Text>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Jane"
              placeholderTextColor="#999"
              value={firstName}
              onChangeText={setFirstName}
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Doe"
              placeholderTextColor="#999"
              value={lastName}
              onChangeText={setLastName}
            />
          </View>
        </View>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="hello@example.com"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={styles.input}
          placeholder="+27 00 000 0000"
          placeholderTextColor="#999"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Date of Birth</Text>
        <TextInput
          style={styles.input}
          placeholder="DD/MM/YYYY"
          placeholderTextColor="#999"
          value={dob}
          onChangeText={setDob}
          keyboardType="numbers-and-punctuation"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Text style={styles.label}>Confirm Password</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor="#999"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        {!!error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>JOIN THE COMMUNITY  →</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.loginRow}>
          <Text style={styles.loginText}>
            Already a member? <Text style={styles.loginBold}>Login</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerWordmark}>&FRIENDS</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 24 : 60,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  headline: {
    fontFamily: 'BebasNeue',
    fontSize: 44,
    lineHeight: 42,
    letterSpacing: 0.4,
    color: colors.textPrimary,
    marginBottom: 16,
  },
  subtext: {
    fontFamily: 'Inter',
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    marginBottom: 28,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 24,
  },
  cardTitle: {
    fontFamily: 'BebasNeue',
    fontSize: 28,
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 20,
  },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  label: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    letterSpacing: 1,
    color: colors.labelMuted,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    backgroundColor: '#ECECEC',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'Inter',
    fontSize: 15,
    color: colors.textPrimary,
  },
  errorText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#B23A2E',
    marginTop: 10,
  },
  button: {
    backgroundColor: colors.ctaBlack,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 22,
  },
  buttonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 13,
    letterSpacing: 1,
    color: '#fff',
  },
  loginRow: { marginTop: 18, alignItems: 'center' },
  loginText: { fontFamily: 'Inter', fontSize: 14, color: colors.textMuted },
  loginBold: { fontFamily: 'Inter-Bold', color: colors.textPrimary, textDecorationLine: 'underline' },
  footer: { alignItems: 'center', marginTop: 32 },
  footerWordmark: {
    fontFamily: 'BebasNeue',
    fontSize: 13,
    letterSpacing: 2,
    color: '#A1A1AA',
    textTransform: 'uppercase',
  },
});