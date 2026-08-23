import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { registerUser } from '../../src/services/authService';

export default function RegisterScreen() {
  // One state variable per field. Matches exactly what registerUser()
  // in authService.ts expects — name, email, password, phone, dob.
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState(''); // plain text for now, format YYYY-MM-DD

  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Guard clauses — catch obvious problems before ever calling Firebase.
    // Doing this client-side saves a wasted network round trip on bad input.
    if (!name || !email || !password || !phone || !dob) {
      Alert.alert('Missing info', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      // Firebase's own minimum is 6 characters — checking here gives
      // a clearer error than letting Firebase reject it.
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      // This one call does both steps: creates the Firebase Auth account
      // AND writes the matching Firestore users/{uid} document.
      await registerUser(name, email, password, phone, dob);
      // Same as login — no manual navigation needed. Once registerUser
      // succeeds, Firebase Auth's state changes, AuthContext's listener
      // fires, and _layout.tsx's RedirectGate sends the user to /(tabs)/home.
    } catch (error: any) {
      // Common Firebase error: auth/email-already-in-use.
      // Generic message for now, can be refined with error.code later.
      Alert.alert('Registration failed', error.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // ScrollView instead of View — this form has more fields than login,
    // so it needs to scroll on smaller screens / when the keyboard is open.
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <TextInput style={styles.input} placeholder="Full Name" value={name} onChangeText={setName} />
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
        placeholder="Phone Number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Date of Birth (YYYY-MM-DD)"
        value={dob}
        onChangeText={setDob}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Creating account...' : 'Register'}</Text>
      </TouchableOpacity>

      <Link href="/(auth)/login" style={styles.link}>
        Already have an account? Log In
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: '#FFFFFF' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 24, color: '#000000' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    color: '#000000',
    backgroundColor: '#FFFFFF',
  },
  button: {
    backgroundColor: '#C1502E',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  link: { marginTop: 20, textAlign: 'center', color: '#C1502E' },
});