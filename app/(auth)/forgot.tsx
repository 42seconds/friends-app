import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T, H1, Amp, TopBar, Field, PrimaryButton, OutlineButton, TextLink, Screen, Note } from '../../src/components/night';
import { resetPassword, resetErrorMessage } from '../../src/services/authService';
import { night } from '../../src/theme/night';
import { LIMITS, checkEmail } from '../../src/lib/validation';
import { safeBack } from '../../src/lib/nav';
import { requireOnline } from '../../src/lib/online';

const RESEND_SECONDS = 60;

// Forgot password: ask for the email, send Firebase's reset link, then
// show what to do next. Firebase doesn't reveal whether an account
// exists for an email (that would let anyone check who is signed up),
// so the confirmation is worded "if there's an account".
export default function ForgotPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (!wait) return;
    const id = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);

  const send = async () => {
    const problem = checkEmail(email);
    setError(problem ?? '');
    if (problem) return;
    setSending(true);
    try {
      await requireOnline();
      await resetPassword(email.trim());
      setSentTo(email.trim());
      setWait(RESEND_SECONDS);
    } catch (e) {
      setError(resetErrorMessage(e));
    } finally {
      setSending(false);
    }
  };

  const backToLogin = () => router.replace({ pathname: '/(auth)/login', params: sentTo ? { email: sentTo } : {} });

  return (
    <Screen
      header={<TopBar dark onBack={() => safeBack(router, '/(auth)/login')} />}
      bg={night.ink}
      dark
      padTop={false}
      fill
      contentStyle={{ backgroundColor: night.paper, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 26, gap: 16 }}
      hero={
        <View style={{ paddingHorizontal: 20, paddingBottom: 30, overflow: 'hidden' }}>
          <Amp size={300} color={sentTo ? night.lime : night.blue} style={{ right: -40, top: 10 }} />
          <View style={{ paddingTop: 20, gap: 14 }}>
            <H1 size={64} color={night.paper}>{sentTo ? 'Check your\ninbox' : 'Forgot your\npassword?'}</H1>
            <T size={15} lh={1.5} color={night.inkMuted} style={{ maxWidth: 260 }}>
              {sentTo ? 'Your reset link is on its way.' : "No stress. We'll email you a link to choose a new one."}
            </T>
          </View>
        </View>
      }
    >
      {!sentTo ? (
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
          <PrimaryButton label="Send reset link" onPress={send} loading={sending} />
          <Note icon="logo-google" tone="cream">
            <T size={13} lh={1.5}>Signed up with <T size={13} weight="700">Continue with Google</T>? You don't have a password with us. Just use the Google button on the login screen.</T>
          </Note>
          <View style={{ marginTop: 'auto', paddingTop: 12, alignItems: 'center' }}>
            <TextLink label="Back to log in" onPress={backToLogin} />
          </View>
        </>
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 16, borderRadius: 18, backgroundColor: night.card, borderWidth: 1.5, borderColor: night.line }}>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: night.lime, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="mail-open-outline" size={22} color={night.ink} />
            </View>
            <T size={14} lh={1.45} style={{ flex: 1 }}>
              If there's an account for <T size={14} weight="700">{sentTo}</T>, a reset link is in that inbox now.
            </T>
          </View>

          <View style={{ gap: 10 }}>
            <T size={12} weight="600" ls={1} color={night.muted}>WHAT TO DO NEXT</T>
            {[
              ['1', 'Open the email from &FRIENDS (it can take a minute or two).'],
              ['2', 'Tap the link and choose a new password.'],
              ['3', 'Come back here and log in with it.'],
            ].map(([n, text]) => (
              <View key={n} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <View style={{ width: 26, height: 26, borderRadius: 99, backgroundColor: night.ink, alignItems: 'center', justifyContent: 'center' }}>
                  <T size={13} weight="700" color={night.paper}>{n}</T>
                </View>
                <T size={14} style={{ flex: 1 }}>{text}</T>
              </View>
            ))}
          </View>

          <Note icon="alert-circle-outline" tone="cream">
            <T size={13} lh={1.5}>Nothing yet? Check your <T size={13} weight="700">spam or promotions</T> folder, and make sure the email above is spelled right.</T>
          </Note>

          <PrimaryButton label="Back to log in" onPress={backToLogin} />
          <OutlineButton
            label={wait ? `Resend link in ${wait}s` : 'Resend link'}
            icon="refresh"
            disabled={!!wait || sending}
            onPress={send}
          />
          <View style={{ alignItems: 'center' }}>
            <TextLink
              label="Use a different email"
              muted
              onPress={() => {
                setSentTo(null);
                setWait(0);
              }}
            />
          </View>
          {!!error && <T size={13} weight="600" color={night.danger} center>{error}</T>}
        </>
      )}
    </Screen>
  );
}
