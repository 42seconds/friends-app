import { View, ActivityIndicator } from 'react-native';

// This screen exists purely so the root path "/" has something to render.
// It should only ever be visible for a split second — _layout.tsx's
// RedirectGate watches auth state and immediately sends the user to
// either /(auth)/login or /(tabs)/home once Firebase reports back.
// If someone ever sees this spinner for more than a second, it usually
// means the redirect logic in _layout.tsx isn't firing correctly.
export default function Index() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}