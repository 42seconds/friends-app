import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import T from './T';
import { night } from '../../theme/night';
import { IconName } from './Buttons';

const ICONS: Record<string, [IconName, IconName]> = {
  home: ['compass', 'compass-outline'],
  tickets: ['ticket', 'ticket-outline'],
  saved: ['heart', 'heart-outline'],
  profile: ['person', 'person-outline'],
};

// Floating ink pill tab bar from the designs. `badges` puts a yellow dot
// on a tab (e.g. Tickets while a payment is being checked).
export default function NightTabBar({ state, descriptors, navigation, badges = {} }: BottomTabBarProps & { badges?: Record<string, boolean> }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ position: 'absolute', left: 16, right: 16, bottom: Math.max(insets.bottom, 12) + 8, height: 68, borderRadius: 24, backgroundColor: night.ink, flexDirection: 'row', alignItems: 'center' }}>
      {state.routes.map((route, index) => {
        // Hidden routes (href: null) have no icon and never render.
        if (!ICONS[route.name]) return null;
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        const label = (options.title ?? route.name) as string;
        const [on, off] = ICONS[route.name];
        const color = focused ? night.paper : night.navInactive;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            style={{ flex: 1, alignItems: 'center', gap: 4, height: '100%', justifyContent: 'center' }}
          >
            <View>
              <Ionicons name={focused ? on : off} size={22} color={color} />
              {badges[route.name] && <View style={{ position: 'absolute', top: -2, right: -4, width: 8, height: 8, borderRadius: 99, backgroundColor: night.yellow }} />}
            </View>
            <T size={11} weight={focused ? '600' : '500'} color={color}>{label}</T>
          </Pressable>
        );
      })}
    </View>
  );
}
