import { ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import T from './T';
import { PrimaryButton } from './Buttons';
import { useUserRole } from '../../hooks/useUserRole';
import { night } from '../../theme/night';

// Staff mode is admin-only. Second layer behind hiding the entry point.
export default function StaffGate({ children }: { children: ReactNode }) {
  const { isAdmin, loading } = useUserRole();
  const router = useRouter();
  if (loading) return <View style={{ flex: 1, backgroundColor: night.ink, justifyContent: 'center' }}><ActivityIndicator color={night.paper} /></View>;
  if (!isAdmin) {
    return (
      <View style={{ flex: 1, backgroundColor: night.ink, justifyContent: 'center', padding: 24, gap: 16 }}>
        <T size={16} color={night.paper} center>Staff mode is for &amp;FRIENDS staff accounts only.</T>
        <PrimaryButton tone="paper" label="Back to Explore" onPress={() => router.replace('/(tabs)/home')} />
      </View>
    );
  }
  return <>{children}</>;
}

export function StaffPill() {
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: night.orange }}>
      <T mono weight="700" size={11}>STAFF</T>
    </View>
  );
}
