import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T, H1, Amp, TopBar, Field, PrimaryButton, OutlineButton, TextLink, Screen, Note, CodeInput } from '../../src/components/night';
import { resetPassword, confirmPasswordReset, logoutUser } from '../../src/services/authService';
import { codeErrorMessage, retryIn } from '../../src/services/otpService';
import { useAuth } from '../../src/context/AuthContext';
import { night } from '../../src/theme/night';
import { LIMITS, checkEmail, checkPassword } from '../../src/lib/validation';
import { safeBack } from '../../src/lib/nav';
import { requireOnline } from '../../src/lib/online';

const RESEND_SECONDS = 60;
type Step = 'email' | 'code' | 'done';

// Forgot password (also "Change password" in Settings):
//   1. your email → we email a 6-digit code
//   2. the code + a new password
//   3. done, log in with it
// The server answers the same whether or not there's an account for the
// email, so this never reveals who is signed up.
export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ email?: string; send?: string }>();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(params.email ?? '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);
  const autoSent = useRef(false);

  useEffect(() => {
    if (!wait) return;
    const id = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);

  const send = async () => {
    const problem = checkEmail(email);
    setError(problem ?? '');
    if (problem) return;
    setBusy(true);
    try {
      await requireOnline();
      const r = await resetPassword(email);
      setStep('code');
      setWait(r.resendIn || RESEND_SECONDS);
    } catch (e) {
      const s = retryIn(e);
      if (s) {
        // A code was sent a moment ago: go on and use that one.
        setStep('code');
        setWait(s);
      } else {
        setError(codeErrorMessage(e));
      }
    } finally {
      setBusy(false);
    }
  };

  // From Settings → Change password: send straight away.
  useEffect(() => {
    if (params.send === '1' && params.email && !autoSent.current) {
      autoSent.current = true;
      send();
    }
  }, []);

  const confirm = async () => {
    const pwProblem = checkPassword(password);
    const codeProblem = code.length === 6 ? null : 'Enter the 6-digit code from the email.';
    setCodeError(codeProblem ?? '');
    setError(pwProblem ?? '');
    if (pwProblem || codeProblem) return;
    setBusy(true);
    try {
      await requireOnline();
      await confirmPasswordReset(email, code, password);
      setStep('done');
    } catch (e) {
      setCodeError(codeErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const toLogin = async () => {
    // Changed from Settings: the old login has been ended everywhere.
    if (user) await logoutUser().catch(() => {});
    router.replace({ pathname: '/(auth)/login', params: { email: email.trim() } });
  };

  const title = step === 'done' ? 'Password\nchanged' : step === 'code' ? 'Check your\ninbox' : 'Forgot your\npassword?';
  const sub =
    step === 'done' ? 'Log in with your new password.'
      : step === 'code' ? 'Enter the code we emailed you and choose a new password.'
        : "No stress. We'll email you a 6-digit code to choose a new one.";

  return (
    <Screen
      header={<TopBar dark onBack={() => (step === 'code' ? setStep('email') : safeBack(router, user ? '/settings/privacy' : '/(auth)/login'))} />}
      bg={night.ink}
      dark
      padTop={false}
      fill
      contentStyle={{ backgroundColor: night.paper, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 26, gap: 16 }}
      hero={
        <View style={{ paddingHorizontal: 20, paddingBottom: 30, overflow: 'hidden' }}>
          <Amp size={300} color={step === 'done' ? night.lime : step === 'code' ? night.orange : night.blue} style={{ right: -40, top: 10 }} />
          <View style={{ paddingTop: 20, gap: 14 }}>
            <H1 size={64} color={night.paper}>{title}</H1>
            <T size={15} lh={1.5} color={night.inkMuted} style={{ maxWidth: 270 }}>{sub}</T>
          </View>
        </View>
      }
    >
      {step === 'email' && (
        <>
          <Field
            label="EMAIL"
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              if (error) setError('');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            maxLength={LIMITS.email}
            placeholder="you@example.com"
            autoFocus={!params.email}
            onSubmitEditing={send}
            error={error}
            hint="Use the email you signed up with."
          />
          <PrimaryButton label="Email me a code" onPress={send} loading={busy} />
          <Note icon="logo-google" tone="cream">
            <T size={13} lh={1.5}>Signed up with <T size={13} weight="700">Continue with Google</T>? You don't have a password with us. Just use the Google button on the login screen.</T>
          </Note>
          <View style={{ marginTop: 'auto', paddingTop: 12, alignItems: 'center' }}>
            <TextLink label={user ? 'Back' : 'Back to log in'} onPress={() => safeBack(router, user ? '/settings/privacy' : '/(auth)/login')} />
          </View>
        </>
      )}

      {step === 'code' && (
        <>
          <T size={14} lh={1.45}>
            If there's an account for <T size={14} weight="700">{email.trim()}</T>, a 6-digit code is in that inbox now. It works for 10 minutes.
          </T>
          <View style={{ gap: 8 }}>
            <T size={12} weight="600" ls={1} color={night.muted}>CODE</T>
            <CodeInput value={code} onChange={(v) => { setCode(v); if (codeError) setCodeError(''); }} error={!!codeError} />
            {!!codeError && <T size={13} weight="600" color={night.danger}>{codeError}</T>}
          </View>
          <Field
            label="NEW PASSWORD"
            value={password}
            onChangeText={(v) => {
              setPassword(v);
              if (error) setError('');
            }}
            secure
            autoCapitalize="none"
            maxLength={LIMITS.password}
            placeholder="8+ characters, a letter and a number"
            onSubmitEditing={confirm}
            error={error}
          />
          <PrimaryButton label="Set new password" onPress={confirm} loading={busy} />
          <OutlineButton label={wait ? `Send a new code in ${wait}s` : 'Send a new code'} icon="refresh" disabled={!!wait || busy} onPress={send} />
          <Note icon="alert-circle-outline" tone="cream">
            <T size={13} lh={1.5}>Nothing yet? Check your <T size={13} weight="700">spam or promotions</T> folder, and that the email above is spelled right.</T>
          </Note>
          <View style={{ alignItems: 'center' }}>
            <TextLink label="Use a different email" muted onPress={() => { setStep('email'); setCode(''); setWait(0); }} />
          </View>
        </>
      )}

      {step === 'done' && (
        <>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 16, borderRadius: 18, backgroundColor: night.successBg }}>
            <Ionicons name="checkmark-circle" size={26} color={night.success} />
            <T size={14} lh={1.45} style={{ flex: 1 }}>
              Your password is changed. For your safety you've been logged out on your other devices.
            </T>
          </View>
          <PrimaryButton label="Log in" onPress={toLogin} />
        </>
      )}
    </Screen>
  );
}
