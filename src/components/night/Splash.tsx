import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { night } from '../../theme/night';

// Brand splash (shown while fonts load, before custom fonts exist, so it
// is drawn with shapes only): four sub-brand dots and a loading bar.
export default function Splash() {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.timing(progress, { toValue: 1, duration: 1400, useNativeDriver: false })).start();
  }, [progress]);
  return (
    <View style={{ flex: 1, backgroundColor: night.ink, alignItems: 'center', justifyContent: 'center', gap: 28 }}>
      <View style={{ width: 120, height: 120, borderRadius: 32, backgroundColor: night.orange, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 44, height: 44, borderRadius: 99, borderWidth: 10, borderColor: night.ink }} />
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {[night.blue, night.lime, night.orange, night.yellow].map((c) => (
          <View key={c} style={{ width: 12, height: 12, borderRadius: 99, backgroundColor: c }} />
        ))}
      </View>
      <View style={{ width: 140, height: 4, borderRadius: 99, backgroundColor: night.ink2, overflow: 'hidden' }}>
        <Animated.View style={{ height: 4, borderRadius: 99, backgroundColor: night.paper, width: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 140] }) }} />
      </View>
    </View>
  );
}
