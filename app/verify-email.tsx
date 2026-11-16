import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T, H1, Amp, TopBar, PrimaryButton, OutlineButton, TextLink, Screen, Note, CodeInput } from '../src/components/night';
import { useAuth } from '../src/context/AuthContext';
import { confirmEmailCode, sendVerificationCode } from '../src/services/authService';
import { codeErrorMessage, retryIn } from '../src/services/otpService';
import { requireOnline } from '../src/lib/online';
import { night } from '../src/theme/night';

const RESEND_SECONDS = 60;

// "Confirm your email": shown after sign-up, and when someone with an
// unconfirmed email tries to book. We email a 6-digit code; typing it in
// confirms the address (checked on the server).
export default function VerifyEmailScreen() {
  const router = useRouter();
  const { next, reason } = useLocalSearchParams<{ next?: string; reason?: string }>();
  const { user, emailVerified, setEmailVerified } = useAuth();
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [wait, setWait] = useState(0);
  const sentOnce = useRef(false);
  const done = useRef(false);

  const goOn = () => {
    if (done.current) return;
    done.current = true;
    if (next) router.replace(next as any);
    else if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/home');
  };

  useEffect(() => {
    if (!wait) return;
    const id = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);

  const send = async (first = false) => {
    setSending(true);
    setError('');
    setNotice('');
    try {
      await requireOnline();
      const r = await sendVerificationCode();
      setWait(r.resendIn || RESEND_SECONDS);
      setNotice(first ? '' : 'Sent. Check your inbox (and the spam folder).');
    } catch (e) {
      const s = retryIn(e);
      if (s) setWait(s); // one was sent a moment ago: use that one
      else setError(codeErrorMessage(e));
    } finally {
      setSending(false);
    }
  };

  // Email the code as soon as the screen opens.
  useEffect(() => {
    if (user && !emailVerified && !sentOnce.current) {
      sentOnce.current = true;
      send(true);
    }
  }, [user, emailVerified]);

  const check = async (typed = code) => {
    if (typed.length !== 6) {
      setError('Enter the 6-digit code from the email.');
      return;
    }
    setChecking(true);
    setError('');
    try {
      await requireOnline();
      const ok = await confirmEmailCode(typed);
      if (ok) setEmailVerified(true);
      else setError('Confirmed, but the app needs a moment. Tap the button again.');
    } catch (e) {
      setError(codeErrorMessage(e));
      setCode('');
    } finally {
      setChecking(false);
    }
  };

  const title = emailVerified ? "You're\nconfirmed" : reason === 'book' ? 'Confirm your\nemail to book' : 'Confirm your\nemail';

  return (
    <Screen
      header={<TopBar dark onBack={goOn} />}
      bg={night.ink}
      dark
      padTop={false}
      fill
      contentStyle={{ backgroundColor: night.paper, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 26, gap: 16 }}
      hero={
        <View style={{ paddingHorizontal: 20, paddingBottom: 30, overflow: 'hidden' }}>
          <Amp size={300} color={emailVerified ? night.lime : night.orange} style={{ right: -40, top: 10 }} />
          <View style={{ paddingTop: 20, gap: 14 }}>
            <H1 size={64} color={night.paper}>{title}</H1>
            <T size={15} lh={1.5} color={night.inkMuted} style={{ maxWidth: 270 }}>
              {emailVerified ? 'Thanks. You can book tickets now.' : 'It keeps your tickets safe and lets us reach you about your bookings.'}
            </T>
          </View>
        </View>
      }
    >
      {emailVerified ? (
        <>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 16, borderRadius: 18, backgroundColor: night.successBg }}>
            <Ionicons name="checkmark-circle" size={26} color={night.success} />
            <T size={14} lh={1.45} style={{ flex: 1 }}>
              <T size={14} weight="700">{user?.email}</T> is confirmed.
            </T>
          </View>
          <PrimaryButton label="Continue" onPress={goOn} />
        </>
      ) : (
        <>
          <T size={14} lh={1.45}>
            We emailed a 6-digit code to <T size={14} weight="700">{user?.email ?? 'your email'}</T>. It works for 10 minutes.
          </T>
          <View style={{ gap: 8 }}>
            <T size={12} weight="600" ls={1} color={night.muted}>CODE</T>
            <CodeInput value={code} onChange={(v) => { setCode(v); if (error) setError(''); }} onComplete={(v) => check(v)} error={!!error} disabled={checking} />
            {!!error && <T size={13} weight="600" color={night.danger}>{error}</T>}
            {!!notice && <T size={13} weight="600" color={night.success}>{notice}</T>}
          </View>

          <PrimaryButton label="Confirm my email" icon="checkmark-circle-outline" arrow={false} center loading={checking} onPress={() => check()} />
          <OutlineButton label={wait ? `Send a new code in ${wait}s` : 'Send a new code'} icon="refresh" disabled={!!wait || sending} onPress={() => send()} />

          <Note icon="alert-circle-outline" tone="cream">
            <T size={13} lh={1.5}>Nothing yet? Check your <T size={13} weight="700">spam or promotions</T> folder. The email can take a minute or two.</T>
          </Note>

          <View style={{ marginTop: 'auto', paddingTop: 12, alignItems: 'center' }}>
            <TextLink label={reason === 'book' ? 'Not now' : 'Do this later'} muted onPress={goOn} />
          </View>
        </>
      )}
    </Screen>
  );
}
