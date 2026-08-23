import { Tabs } from 'expo-router';
import { useUserRole } from '../../src/hooks/useUserRole';

// This defines the bottom tab bar shell. Expo Router automatically
// matches each <Tabs.Screen name="X"> to a file called X.tsx in this
// same (tabs) folder.

export default function TabsLayout() {
  const { isAdmin } = useUserRole();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#C1502E',
        headerShown: false,
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Events' }} />
      <Tabs.Screen name="tickets" options={{ title: 'My Tickets' }} />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          // href: null hides this tab from the bottom bar for non-admins
          // while keeping the route technically registered. scan.tsx
          // also re-checks isAdmin itself, so even a direct deep link
          // can't bypass the gate — two layers, not one.
          href: isAdmin ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="approvals"
        options={{
          title: 'Approve',
          href: isAdmin ? undefined : null,
        }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}