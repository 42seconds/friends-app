import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { loginUser } from '../../src/services/authService';
import { cardShadow, colors } from '../../src/styles/shared';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await loginUser(email, password);
    } catch (err) {
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <Text style={styles.eyebrow}>&FRIENDS COMMUNITY</Text>
      <Text style={styles.headline}>Welcome{'\n'}Back</Text>
      <Text style={styles.subtext}>
        Step back into a vibrantly creative community connecting the pulse of Johannesburg with the world.
      </Text>

      <View style={[styles.card, cardShadow(4)]}>
        <Text style={styles.cardTitle}>Log In</Text>

        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="jane.doe@example.com"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <View style={styles.passwordRow}>
          <Text style={styles.label}>Password</Text>
          <TouchableOpacity>
            <Text style={styles.forgotLink}>FORGOT?</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {!!error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>LOG IN TO SPACE</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.signupRow}>
          <Text style={styles.signupText}>
            Don't have an account? <Text style={styles.signupBold}>Sign up</Text>
          </Text>
        </TouchableOpacity>
      </View>
            <View style={styles.footer}>
        <Text style={styles.footerWordmark}>&FRIENDS</Text>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 24 : 60,
    paddingHorizontal: 24,
  },
  eyebrow: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    letterSpacing: 1.5,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  headline: {
  fontFamily: 'BebasNeue',
  fontSize: 44,
  lineHeight: 42,
  letterSpacing: 0.4,
  color: colors.textPrimary,
  marginBottom: 16,
},
card: {
  backgroundColor: colors.card,
  borderRadius: 24,
  padding: 24,
},
button: {
  backgroundColor: colors.ctaBlack,
  borderRadius: 12,
  paddingVertical: 16,
  alignItems: 'center',
  marginTop: 20,
},
footer: {
  alignItems: 'center',
  marginTop: 32,
},
footerWordmark: {
  fontFamily: 'BebasNeue',
  fontSize: 13,
  letterSpacing: 2,
  color: '#A1A1AA',
  textTransform: 'uppercase',
},

  subtext: {
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
    marginBottom: 28,
  },

  cardTitle: {
    fontFamily: 'BebasNeue',
    fontSize: 24,
    color: colors.textPrimary,
    marginBottom: 20,
  },
  label: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    letterSpacing: 1,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  passwordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  forgotLink: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
  input: {
    backgroundColor: '#EDEDED',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'Inter',
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  errorText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#B23A2E',
    marginTop: 8,
  },

  buttonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    letterSpacing: 1,
    color: '#fff',
  },
  signupRow: { marginTop: 20, alignItems: 'center' },
  signupText: { fontFamily: 'Inter-Bold', fontSize: 14, color: colors.textMuted },
  signupBold: { fontFamily: 'Inter-Bold', color: colors.textPrimary, textDecorationLine: 'underline' },
});