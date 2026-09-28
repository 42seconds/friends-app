import { Tabs } from 'expo-router';
import { NightTabBar } from '../../src/components/night';
import { useBookings } from '../../src/hooks/useBookings';
import { night } from '../../src/theme/night';

export default function TabsLayout() {
  const { tickets } = useBookings();
  // Yellow dot on Tickets while a booking needs attention.
  const pending = tickets.some((t) => t.status === 'pending_verification' || t.status === 'pending_payment' || t.status === 'rejected');

  return (
    <Tabs screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: night.paper } }} tabBar={(props) => <NightTabBar {...props} badges={{ tickets: pending }} />}>
      <Tabs.Screen name="home" options={{ title: 'Explore' }} />
      <Tabs.Screen name="tickets" options={{ title: 'Tickets' }} />
      <Tabs.Screen name="saved" options={{ title: 'Saved' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      {/* Staff tools moved to the Staff mode stack (/staff); these old
          tab routes only redirect there and stay out of the tab bar. */}
      <Tabs.Screen name="scan" options={{ href: null }} />
      <Tabs.Screen name="approvals" options={{ href: null }} />
    </Tabs>
  );
}
