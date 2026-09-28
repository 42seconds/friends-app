import { Text, TextProps, TextStyle, StyleProp } from 'react-native';
import { fonts, night } from '../../theme/night';

type Weight = '400' | '500' | '600' | '700';

interface Props extends TextProps {
  size?: number;
  weight?: Weight;
  color?: string;
  display?: boolean; // Bebas Neue
  mono?: boolean; // JetBrains Mono
  center?: boolean;
  lh?: number; // line-height multiplier
  ls?: number; // letter-spacing in px
  style?: StyleProp<TextStyle>;
}

const sansFor: Record<Weight, string> = {
  '400': fonts.regular,
  '500': fonts.medium,
  '600': fonts.semibold,
  '700': fonts.bold,
};

// The one text primitive. Custom fonts on native need a family per
// weight, so `weight` picks the right Instrument Sans / Mono file.
export default function T({ size = 15, weight = '400', color = night.ink, display, mono, center, lh, ls, style, ...rest }: Props) {
  const fontFamily = display ? fonts.display : mono ? (weight === '700' ? fonts.monoBold : fonts.mono) : sansFor[weight];
  // Bebas renders tight; the designs use ~0.84-0.9 line-height for display type.
  const lineHeight = lh ? Math.round(size * lh) : display ? Math.round(size * 0.92) : undefined;
  return (
    <Text
      {...rest}
      style={[
        { fontFamily, fontSize: size, color, lineHeight, letterSpacing: ls, textAlign: center ? 'center' : undefined },
        display && { paddingTop: size * 0.06 },
        style,
      ]}
    />
  );
}
