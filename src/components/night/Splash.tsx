import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

// Brand splash: a white "&" on black. The "&" is an image (Bebas Neue,
// rendered to assets/splash-amp.png) because this shows before the app's
// custom fonts have loaded. Matches the native launch screen in app.json.
export const SPLASH_BG = '#000000';

export default function Splash() {
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fade]);
  return (
    <View style={{ flex: 1, backgroundColor: SPLASH_BG, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel="&FRIENDS">
      <Animated.Image source={require('../../../assets/splash-amp.png')} style={{ width: 200, height: 200, opacity: fade }} resizeMode="contain" />
    </View>
  );
}
