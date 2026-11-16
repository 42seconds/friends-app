import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T, H1, Screen, TopBar, Field, PrimaryButton, Note } from '../../src/components/night';
import { useAuth } from '../../src/context/AuthContext';
import { loginUser, authErrorMessage } from '../../src/services/authService';
import { enableQuickLogin, quickLoginKind, QuickKind } from '../../src/lib/quickLogin';
import { requireOnline, withTimeout } from '../../src/lib/online';
import { night } from '../../src/theme/night';
import { safeBack } from '../../src/lib/nav';

// Settings → Privacy & security → "Sign in with fingerprint": confirm the
// password once, then the phone's fingerprint/face/PIN replaces it.
export default function QuickLoginScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [kind, setKind] = useState<QuickKind | null>(null);
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    quickLoginKind().then(setKind);
  }, []);

  const turnOn = async () => {
    if (!user?.email) return;
    if (!password) return setError('Enter your password.');
    setBusy(true);
    setError('');
    try {
      await requireOnline();
      // Checks the password is right (signs in again as the same person).
      await withTimeout(loginUser(user.email, password), 20000);
      const r = await enableQuickLogin(user.email, password);
      if (r === 'ok') safeBack(router, '/settings/privacy');
      else if (r === 'failed') setError("Your phone couldn't confirm it's you. Try again.");
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const label = kind?.label ?? 'fingerprint';
  return (
    <Screen header={<TopBar />} footer={<PrimaryButton label={`Turn on ${label} sign-in`} icon={kind?.icon ?? 'finger-print'} arrow={false} center loading={busy} onPress={turnOn} />}>
      <H1 size={52}>Sign in with{'\n'}{label}</H1>
      <T size={15} lh={1.5} color={night.body}>Skip typing your password on this phone. Enter it once below to confirm it's you.</T>
      {kind && !kind.available ? (
        <Note icon="alert-circle-outline" tone="cream">
          <T size={13} lh={1.5}>This phone has no fingerprint, face or screen lock set up. Add one in your phone's settings first.</T>
        </Note>
      ) : (
        <Field
          label="PASSWORD"
          value={password}
          onChangeText={(v) => { setPassword(v); setError(''); }}
          secure={!show}
          autoCapitalize="none"
          autoFocus
          onSubmitEditing={turnOn}
          error={error}
          right={
            <Pressable accessibilityLabel={show ? 'Hide password' : 'Show password'} onPress={() => setShow((s) => !s)} hitSlop={8}>
              <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={night.muted} />
            </Pressable>
          }
        />
      )}
      <View style={{ gap: 8 }}>
        <Note icon="lock-closed-outline" tone="cream">
          <T size={13} lh={1.5}>Your login is kept encrypted in this phone's secure storage and only opened after your {label}. Turn it off any time in Settings.</T>
        </Note>
      </View>
    </Screen>
  );
}
