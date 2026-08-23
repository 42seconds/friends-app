import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Link } from 'expo-router';
import { loginUser } from '../../src/services/authService';

export default function LoginScreen() {
  // Local state for the two form fields. This is UI-only state —
  // it doesn't need to live in AuthContext because nothing outside
  // this screen cares about what's currently typed in the boxes.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Tracks whether a login request is currently in flight,
  // so we can disable the button and show feedback instead of
  // letting the user tap it five times.
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // Basic guard — don't even attempt Firebase if fields are empty.
    if (!email || !password) {
      Alert.alert('Missing info', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      // This is the only line that actually talks to Firebase.
      // Everything else here is just UI plumbing around it.
      await loginUser(email, password);
      // No need to navigate manually on success — remember, _layout.tsx's
      // RedirectGate is watching auth state and will redirect to
      // /(tabs)/home automatically once Firebase confirms the login.
    } catch (error: any) {
      // Firebase throws descriptive error codes (e.g. auth/wrong-password).
      // For the demo, a generic message is fine — you can make this
      // more specific later by switching on error.code.
      Alert.alert('Login failed', 'Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>&FRIENDS</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Log In'}</Text>
      </TouchableOpacity>

      {/* Link is Expo Router's version of a navigation link —
          tapping this pushes the user to app/(auth)/register.tsx */}
      <Link href="/(auth)/register" style={styles.link}>
        Don't have an account? Register
      </Link>
    </View>
  );
}
// Styles updated: white background, black text, terracotta stays as the
// one accent color for the button and link (per design tokens).
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#FFFFFF' },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 32, color: '#000000' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    color: '#000000',        // typed text is black
    backgroundColor: '#FFFFFF',
  },
  button: {
    backgroundColor: '#C1502E',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  link: { marginTop: 20, textAlign: 'center', color: '#C1502E' },
});