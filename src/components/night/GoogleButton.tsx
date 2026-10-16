import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import T from './T';
import { OutlineButton } from './Buttons';
import { night } from '../../theme/night';
import { googleSignInAvailable, signInWithGoogle, googleErrorMessage, GoogleSignInCancelled } from '../../services/googleAuth';
import { requireOnline } from '../../lib/online';

// "Continue with Google" with an "or" divider above it. Renders nothing
// where Google sign-in can't work (Expo Go, web).
export default function GoogleButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!googleSignInAvailable) return null;

  const go = async () => {
    setBusy(true);
    setError('');
    try {
      await requireOnline();
      const { isNew } = await signInWithGoogle();
      // Returning members are sent on by the RedirectGate; new ones
      // see the notifications step first, like email sign-ups.
      if (isNew) router.replace('/notifications-optin');
    } catch (e) {
      if (!(e instanceof GoogleSignInCancelled)) setError(googleErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: night.border }} />
        <T size={13} color={night.muted}>or</T>
        <View style={{ flex: 1, height: 1, backgroundColor: night.border }} />
      </View>
      {busy ? (
        <ActivityIndicator color={night.ink} style={{ height: 52 }} />
      ) : (
        <OutlineButton icon="logo-google" label="Continue with Google" onPress={go} />
      )}
      {!!error && <T size={13} weight="600" color={night.danger}>{error}</T>}
    </View>
  );
}
