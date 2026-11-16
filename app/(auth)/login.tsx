import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T, H1, Amp, TopBar, Field, PrimaryButton, TextLink, Screen, GoogleButton } from '../../src/components/night';
import { loginUser, authErrorMessage } from '../../src/services/authService';
import { useAuth } from '../../src/context/AuthContext';
import { night } from '../../src/theme/night';
import { LIMITS, checkEmail } from '../../src/lib/validation';
import { safeBack } from '../../src/lib/nav';
import { requireOnline, withTimeout } from '../../src/lib/online';
import { setSigningUp } from '../../src/lib/signupFlow';
import { enableQuickLogin, forgetIfStale, markQuickLoginAsked, quickLoginEmail, quickLoginKind, QuickKind, shouldOfferQuickLogin, unlockSavedLogin } from '../../src/lib/quickLogin';

// "Use your fingerprint next time?" after a password login.
function askQuickLogin(kind: QuickKind): Promise<boolean> {
  return new Promise((resolve) =>
    Alert.alert(
      `Sign in with your ${kind.label}?`,
      `Next time, skip the password: just use your ${kind.label}. You can turn this off in Settings → Privacy & security.`,
      [
        { text: 'Not now', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Turn on', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    )
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const { setBrowsing } = useAuth();
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [done, setDone] = useState(false);

  const emailOk = !checkEmail(email);

  // Quick sign-in (fingerprint / face / phone PIN), if set up on this phone.
  const [quick, setQuick] = useState<{ email: string; kind: QuickKind } | null>(null);
  const autoPrompted = useRef(false);
  useEffect(() => {
    (async () => {
      const [saved, kind] = await Promise.all([quickLoginEmail(), quickLoginKind()]);
      if (saved && kind.available) setQuick({ email: saved, kind });
    })();
  }, []);

  const quickSignIn = async () => {
    if (loading || done) return;
    setError('');
    setEmailError('');
    const r = await unlockSavedLogin();
    if (r.result !== 'ok') {
      if (r.result === 'missing') setQuick(null);
      else if (r.result === 'failed') setError("That didn't match. Try again, or use your password.");
      return;
    }
    setLoading(true);
    try {
      await requireOnline();
      await withTimeout(loginUser(r.email, r.password), 20000);
      setDone(true);
    } catch (e) {
      if (await forgetIfStale(e)) {
        setQuick(null);
        setEmail(r.email);
        setError('Your password has changed. Log in with the new one; you can turn quick sign-in back on after.');
      } else {
        setError(authErrorMessage(e));
      }
      setLoading(false);
    }
  };

  // Open the fingerprint prompt straight away when it's set up.
  useEffect(() => {
    if (quick && !autoPrompted.current && !params.email) {
      autoPrompted.current = true;
      quickSignIn();
    }
  }, [quick]);

  // AuthContext picks up the login and the RedirectGate sends the user
  // on to Explore — nothing to navigate here.
  const handleLogin = async () => {
    if (loading || done) return;
    setError('');
    setEmailError('');
    if (!email.trim()) return setEmailError('Enter your email.');
    if (!emailOk) return setEmailError(checkEmail(email) as string);
    if (!password) return setError('Enter your password.');
    setLoading(true);
    // Offer quick sign-in once on this phone; hold the move to Explore
    // until they've answered.
    const offer = await shouldOfferQuickLogin();
    const kind = offer ? await quickLoginKind() : null;
    if (offer) setSigningUp(true);
    try {
      await requireOnline();
      await withTimeout(loginUser(email.trim(), password), 20000);
      // Keep the button in its "done" state while the app moves on to
      // Explore, so it never looks like nothing happened.
      setDone(true);
      if (offer && kind) {
        await markQuickLoginAsked();
        if (await askQuickLogin(kind)) await enableQuickLogin(email, password).catch(() => {});
      }
    } catch (e) {
      setError(authErrorMessage(e));
      setLoading(false);
    } finally {
      if (offer) setSigningUp(false);
    }
  };

  const forgot = () => router.push({ pathname: '/(auth)/forgot', params: emailOk ? { email: email.trim() } : {} });

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
      {quick && (
        <View style={{ gap: 10 }}>
          <PrimaryButton
            tone="orange"
            icon={quick.kind.icon}
            arrow={false}
            center
            label={`Sign in with ${quick.kind.label}`}
            onPress={quickSignIn}
            loading={loading && !done}
            disabled={done}
          />
          <T size={13} color={night.muted} center>as {quick.email}</T>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: night.border }} />
            <T size={13} color={night.muted}>or use your password</T>
            <View style={{ flex: 1, height: 1, backgroundColor: night.border }} />
          </View>
        </View>
      )}
      <Field label="EMAIL" value={email} onChangeText={(v) => { setEmail(v); setEmailError(''); setError(''); }} keyboardType="email-address" autoCapitalize="none" maxLength={LIMITS.email} placeholder="you@example.com" right={emailOk ? <Ionicons name="checkmark-circle" size={20} color={night.success} /> : undefined} error={emailError} />
      <Field
        label="PASSWORD"
        value={password}
        onChangeText={(v) => { setPassword(v); setError(''); }}
        secure={!show}
        autoCapitalize="none"
        onSubmitEditing={handleLogin}
        labelRight={
          <Pressable onPress={forgot} hitSlop={8} accessibilityRole="link">
            <T size={13} weight="600" style={{ textDecorationLine: 'underline' }}>Forgot password?</T>
          </Pressable>
        }
        right={
          <Pressable accessibilityLabel={show ? 'Hide password' : 'Show password'} onPress={() => setShow((s) => !s)} hitSlop={8}>
            <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={night.muted} />
          </Pressable>
        }
        error={error}
      />
      <PrimaryButton label={done ? 'Logged in, opening the app…' : 'Log in'} icon={done ? 'checkmark-circle' : undefined} arrow={!done} onPress={handleLogin} loading={loading && !done} disabled={done} style={{ marginTop: 6 }} />
      <GoogleButton />
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
