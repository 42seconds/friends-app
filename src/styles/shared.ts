import { Platform, ViewStyle } from 'react-native';

// One shadow definition that renders identically-ish on both platforms,
// instead of writing iOS shadow props on every card and having Android
// silently ignore them.
export function cardShadow(elevation: number = 4): ViewStyle {
  return Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: elevation / 2 },
      shadowOpacity: 0.08,
      shadowRadius: elevation,
    },
    android: {
      elevation,
    },
    default: {},
  }) as ViewStyle;
}

export const colors = {
  background: '#FBFBFB',
  card: '#FFFFFF',
  ctaBlack: '#202020',
  textPrimary: '#1A1A1A',
  textMuted: '#6B7280',
  labelMuted: '#52525B',
  pillNeutral: '#E5E5E5',
  darkSurface: '#1C1310',
};