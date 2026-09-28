import { View } from 'react-native';
import T from './T';
import { night } from '../../theme/night';

// Stylised street-grid illustration with the "&" pin. Decorative only:
// real maps open in Google/Apple Maps.
export default function MapArt({ height = 360, route }: { height?: number; route?: boolean }) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ height, backgroundColor: night.sand, overflow: 'hidden' }}>
      {[40, 120, 210, 300].map((top) => (
        <View key={top} style={{ position: 'absolute', left: -20, right: -20, top, height: 14, backgroundColor: night.card, transform: [{ rotate: '-8deg' }] }} />
      ))}
      {[60, 170, 280].map((left) => (
        <View key={left} style={{ position: 'absolute', top: -20, bottom: -20, left, width: 12, backgroundColor: night.card, transform: [{ rotate: '6deg' }] }} />
      ))}
      <View style={{ position: 'absolute', right: 30, top: 60, width: 90, height: 70, borderRadius: 16, backgroundColor: '#D4DDB8' }} />
      {route && (
        <>
          <View style={{ position: 'absolute', left: 66, top: height * 0.7, width: 12, height: 12, borderRadius: 99, backgroundColor: night.blue, borderWidth: 3, borderColor: night.card }} />
          <View style={{ position: 'absolute', left: 71, top: height * 0.36, width: 4, height: height * 0.34, backgroundColor: night.ink, borderRadius: 4 }} />
          <View style={{ position: 'absolute', left: 71, top: height * 0.36, width: 110, height: 4, backgroundColor: night.ink, borderRadius: 4 }} />
        </>
      )}
      <View style={{ position: 'absolute', left: route ? 166 : '50%', top: route ? height * 0.36 - 44 : height / 2 - 60, marginLeft: route ? 0 : -28, alignItems: 'center' }}>
        <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: night.orange, borderWidth: 3, borderColor: night.ink, alignItems: 'center', justifyContent: 'center' }}>
          <T display size={34}>&amp;</T>
        </View>
        <View style={{ width: 12, height: 12, backgroundColor: night.ink, transform: [{ rotate: '45deg' }], marginTop: -7 }} />
      </View>
    </View>
  );
}
