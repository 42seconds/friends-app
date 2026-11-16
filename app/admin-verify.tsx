import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { T, H1, Amp, PrimaryButton, OutlineButton, TextLink, Screen, Note, CodeInput, StaffPill } from '../src/components/night';
import { useAuth } from '../src/context/AuthContext';
import { auth } from '../src/firebase/firebaseConfig';
import { logoutUser } from '../src/services/authService';
import { codeErrorMessage, retryIn, sendCode, verifyCode } from '../src/services/otpService';
import { setAdminTrust } from '../src/lib/adminTrust';
import { requireOnline } from '../src/lib/online';
import { night } from '../src/theme/night';

const RESEND_SECONDS = 60;

// Admin 2-step verification. After an admin logs in with their password,
// this asks for a 6-digit code emailed to them, checked on the server.
// It unlocks the app (and staff mode) on this device for 12 hours.
export default function AdminVerifyScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [wait, setWait] = useState(0);
  const sentOnce = useRef(false);

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
      const r = await sendCode('admin-login');
      setWait(r.resendIn || RESEND_SECONDS);
      if (!first) setNotice('Sent. Check your inbox (and the spam folder).');
    } catch (e) {
      const s = retryIn(e);
      if (s) setWait(s);
      else setError(codeErrorMessage(e));
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (user && !sentOnce.current) {
      sentOnce.current = true;
      send(true);
    }
  }, [user]);

  const check = async (typed = code) => {
    if (!user) return;
    if (typed.length !== 6) {
      setError('Enter the 6-digit code from the email.');
      return;
    }
    setChecking(true);
    setError('');
    try {
      await requireOnline();
      const r = await verifyCode('admin-login', typed);
      // Pick up the server's "2-step done" mark on the login token.
      await auth.currentUser?.getIdToken(true).catch(() => {});
      setAdminTrust(user.uid, r.until ?? Date.now() + 12 * 3600 * 1000);
      // The redirect gate now lets the admin through.
    } catch (e) {
      setError(codeErrorMessage(e));
      setCode('');
    } finally {
      setChecking(false);
    }
  };

  const logOut = async () => {
    await logoutUser().catch(() => {});
    router.replace('/(auth)/login');
  };

  return (
    <Screen
      bg={night.ink}
      dark
      padTop={false}
      fill
      contentStyle={{ backgroundColor: night.paper, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 26, gap: 16 }}
      hero={
        <View style={{ paddingHorizontal: 20, paddingTop: 56, paddingBottom: 30, overflow: 'hidden' }}>
          <Amp size={300} color={night.orange} style={{ right: -40, top: 30 }} />
          <View style={{ gap: 14 }}>
            <View style={{ alignSelf: 'flex-start' }}><StaffPill /></View>
            <H1 size={64} color={night.paper}>{'One more\nstep'}</H1>
            <T size={15} lh={1.5} color={night.inkMuted} style={{ maxWidth: 280 }}>
              Staff accounts use 2-step verification, so a password alone can't open them.
            </T>
          </View>
        </View>
      }
    >
      <T size={14} lh={1.45}>
        We emailed a 6-digit code to <T size={14} weight="700">{user?.email ?? 'your email'}</T>. It works for 10 minutes.
      </T>
      <View style={{ gap: 8 }}>
        <T size={12} weight="600" ls={1} color={night.muted}>CODE</T>
        <CodeInput value={code} onChange={(v) => { setCode(v); if (error) setError(''); }} onComplete={(v) => check(v)} error={!!error} disabled={checking} />
        {!!error && <T size={13} weight="600" color={night.danger}>{error}</T>}
        {!!notice && <T size={13} weight="600" color={night.success}>{notice}</T>}
      </View>

      <PrimaryButton label="Verify and continue" icon="shield-checkmark-outline" arrow={false} center loading={checking} onPress={() => check()} />
      <OutlineButton label={wait ? `Send a new code in ${wait}s` : 'Send a new code'} icon="refresh" disabled={!!wait || sending} onPress={() => send()} />

      <Note icon="lock-closed-outline" tone="cream">
        <T size={13} lh={1.5}>You'll be asked again after 12 hours, or when you log in on another device. Didn't try to log in? Change your password in Settings.</T>
      </Note>

      <View style={{ marginTop: 'auto', paddingTop: 12, alignItems: 'center' }}>
        <TextLink label="Log out" muted onPress={logOut} />
      </View>
    </Screen>
  );
}
