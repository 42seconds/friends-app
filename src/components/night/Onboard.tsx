import { Pressable, View, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import T from './T';
import { Amp } from './Display';
import { night } from '../../theme/night';
import { SubBrand } from '../../lib/subbrands';

export function PageDots({ index, count = 3, dark = true }: { index: number; count?: number; dark?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }} accessibilityLabel={`Step ${index + 1} of ${count}`}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ width: i === index ? 28 : 12, height: 6, borderRadius: 99, backgroundColor: i === index ? (dark ? night.paper : night.ink) : dark ? night.darkLine : night.border }} />
      ))}
    </View>
  );
}

// Paper pill with a round orange arrow: onboarding "Next".
export function NextPill({ label = 'Next', onPress }: { label?: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => ({ height: 60, paddingLeft: 22, paddingRight: 10, borderRadius: 999, backgroundColor: night.paper, flexDirection: 'row', alignItems: 'center', gap: 14, opacity: pressed ? 0.85 : 1 })}>
      <T size={16} weight="600">{label}</T>
      <View style={{ width: 40, height: 40, borderRadius: 999, backgroundColor: night.orange, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="arrow-forward" size={20} color={night.ink} />
      </View>
    </Pressable>
  );
}

// Coloured sub-brand tile with the "&" watermark.
export function BrandTile({ brand, height = 180, titleSize = 40, style, onPress, selected }: { brand: SubBrand; height?: number; titleSize?: number; style?: StyleProp<ViewStyle>; onPress?: () => void; selected?: boolean }) {
  const body = (
    <View style={[{ height, borderRadius: 22, backgroundColor: brand.color, padding: 14, overflow: 'hidden', justifyContent: 'flex-end', borderWidth: selected ? 3 : 0, borderColor: night.ink }, style]}>
      <Amp size={height * 0.95} color={brand.deep} style={{ right: -14, top: -height * 0.18 }} />
      <Ionicons name={brand.icon} size={26} color={night.ink} style={{ position: 'absolute', left: 14, top: 14 }} />
      <T display size={titleSize}>{brand.name}</T>
      <T size={13} lh={1.35}>{brand.blurb}</T>
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={brand.name} onPress={onPress} style={{ flex: 1 }}>
      {body}
    </Pressable>
  );
}
