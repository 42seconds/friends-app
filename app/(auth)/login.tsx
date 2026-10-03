import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T, H1, Amp, TopBar, Field, PrimaryButton, TextLink, Screen } from '../../src/components/night';
import { loginUser, resetPassword, authErrorMessage } from '../../src/services/authService';
import { useAuth } from '../../src/context/AuthContext';
import { night } from '../../src/theme/night';
import { safeBack } from '../../src/lib/nav';

export default function LoginScreen() {
  const router = useRouter();
  const { setBrowsing } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const emailOk = /\S+@\S+\.\S+/.test(email.trim());

  // AuthContext picks up the login and the RedirectGate sends the user
  // on to Explore — nothing to navigate here.
  const handleLogin = async () => {
    setError('');
    if (!emailOk || !password) {
      setError('Enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await loginUser(email.trim(), password);
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!emailOk) {
      setError('Type your email first, then tap Forgot.');
      return;
    }
    try {
      await resetPassword(email.trim());
      Alert.alert('Check your inbox', `We sent a reset link to ${email.trim()}.`);
    } catch (e) {
      setError(authErrorMessage(e));
    }
  };

  const browse = () => {
    setBrowsing(true);
    router.replace('/(tabs)/home');
  };

  return (
    <Screen header={<TopBar dark onBack={() => safeBack(router, '/(onboarding)/how')} />}
      bg={night.ink}
      dark
      padTop={false}
      fill
      contentStyle={{ backgroundColor: night.paper, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 26, gap: 14 }}
      hero={
        <View style={{ paddingHorizontal: 20, paddingBottom: 30, overflow: 'hidden' }}>
          <Amp size={360} color={night.orange} style={{ right: -40, top: 30 }} />
          <View style={{ paddingTop: 20, gap: 18 }}>
            <H1 size={80} color={night.paper}>Welcome{'\n'}back</H1>
            <T size={15} lh={1.5} color={night.inkMuted} style={{ maxWidth: 240 }}>Your tickets, saves and plans are right where you left them.</T>
          </View>
        </View>
      }
    >
      <Field label="EMAIL" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="you@example.com" right={emailOk ? <Ionicons name="checkmark-circle" size={20} color={night.success} /> : undefined} />
      <Field
        label="PASSWORD"
        value={password}
        onChangeText={setPassword}
        secure={!show}
        autoCapitalize="none"
        onSubmitEditing={handleLogin}
        labelRight={
          <Pressable onPress={handleForgot} hitSlop={8}>
            <T size={13} weight="600" style={{ textDecorationLine: 'underline' }}>Forgot?</T>
          </Pressable>
        }
        right={
          <Pressable accessibilityLabel={show ? 'Hide password' : 'Show password'} onPress={() => setShow((s) => !s)} hitSlop={8}>
            <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={night.muted} />
          </Pressable>
        }
        error={error}
      />
      <PrimaryButton label="Log in" onPress={handleLogin} loading={loading} style={{ marginTop: 6 }} />
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
        <T size={15} color={night.muted}>New here?</T>
        <TextLink label="Create an account" size={15} onPress={() => router.push('/(auth)/register')} />
      </View>
      <View style={{ marginTop: 'auto', paddingTop: 20 }}>
        <TextLink label="Just browsing for now" muted onPress={browse} />
      </View>
    </Screen>
  );
}
