import { useEffect, useRef, useState } from 'react';
import { AppState, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T, H1, Amp, TopBar, PrimaryButton, OutlineButton, TextLink, Screen, Note } from '../src/components/night';
import { useAuth } from '../src/context/AuthContext';
import { checkEmailVerified, resendVerification, resetErrorMessage } from '../src/services/authService';
import { requireOnline } from '../src/lib/online';
import { night } from '../src/theme/night';

const RESEND_SECONDS = 60;

// "Confirm your email": shown after sign-up, and when someone with an
// unconfirmed email tries to book. Firebase emails a link; opening it
// confirms the address. Coming back to the app checks automatically.
export default function VerifyEmailScreen() {
  const router = useRouter();
  const { next, reason } = useLocalSearchParams<{ next?: string; reason?: string }>();
  const { user, emailVerified, setEmailVerified } = useAuth();
  const [checking, setChecking] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [wait, setWait] = useState(reason === 'signup' ? RESEND_SECONDS : 0);
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

  const check = async (quiet = false) => {
    setChecking(true);
    if (!quiet) setMessage('');
    try {
      await requireOnline();
      const ok = await checkEmailVerified();
      if (ok) {
        setEmailVerified(true);
        setMessage('');
      } else if (!quiet) {
        setMessage("Not confirmed yet. Open the link in the email first, then tap the button again.");
      }
    } catch (e) {
      if (!quiet) setMessage(resetErrorMessage(e));
    } finally {
      setChecking(false);
    }
  };

  // Back from the email app: check straight away.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && !emailVerified && check(true));
    return () => sub.remove();
  }, [emailVerified]);

  const resend = async () => {
    setSending(true);
    setMessage('');
    try {
      await requireOnline();
      await resendVerification();
      setWait(RESEND_SECONDS);
      setMessage('Sent. Check your inbox (and the spam folder).');
    } catch (e) {
      setMessage(resetErrorMessage(e));
    } finally {
      setSending(false);
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
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 16, borderRadius: 18, backgroundColor: night.card, borderWidth: 1.5, borderColor: night.line }}>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: night.orange, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="mail-unread-outline" size={22} color={night.ink} />
            </View>
            <T size={14} lh={1.45} style={{ flex: 1 }}>
              We sent a link to <T size={14} weight="700">{user?.email ?? 'your email'}</T>.
            </T>
          </View>

          <View style={{ gap: 10 }}>
            <T size={12} weight="600" ls={1} color={night.muted}>WHAT TO DO</T>
            {[
              ['1', 'Open the email from &FRIENDS.'],
              ['2', 'Tap the link to confirm your email.'],
              ['3', 'Come back here. We check automatically.'],
            ].map(([n, text]) => (
              <View key={n} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <View style={{ width: 26, height: 26, borderRadius: 99, backgroundColor: night.ink, alignItems: 'center', justifyContent: 'center' }}>
                  <T size={13} weight="700" color={night.paper}>{n}</T>
                </View>
                <T size={14} style={{ flex: 1 }}>{text}</T>
              </View>
            ))}
          </View>

          <PrimaryButton label="I've confirmed my email" icon="checkmark-circle-outline" arrow={false} center loading={checking} onPress={() => check()} />
          <OutlineButton label={wait ? `Resend the email in ${wait}s` : 'Resend the email'} icon="refresh" disabled={!!wait || sending} onPress={resend} />
          {!!message && <T size={13} weight="600" color={message.startsWith('Sent') ? night.success : night.danger} center>{message}</T>}

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
