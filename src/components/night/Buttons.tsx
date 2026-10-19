import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import T from './T';
import { night } from '../../theme/night';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

type Tone = 'dark' | 'orange' | 'lime' | 'paper' | 'danger';

const tones: Record<Tone, { bg: string; fg: string; arrow: string }> = {
  dark: { bg: night.ink, fg: night.paper, arrow: night.orange },
  orange: { bg: night.orange, fg: night.ink, arrow: night.ink },
  lime: { bg: night.lime, fg: night.ink, arrow: night.ink },
  paper: { bg: night.paper, fg: night.ink, arrow: night.orange },
  danger: { bg: night.danger, fg: night.paper, arrow: night.paper },
};

interface PrimaryProps {
  label: string;
  onPress?: () => void;
  tone?: Tone;
  icon?: IconName;
  arrow?: boolean;
  loading?: boolean;
  disabled?: boolean;
  center?: boolean;
  style?: StyleProp<ViewStyle>;
}

// The big 58px CTA with the orange arrow — used at the foot of most screens.
export function PrimaryButton({ label, onPress, tone = 'dark', icon, arrow = true, loading, disabled, center, style }: PrimaryProps) {
  const t = tones[tone];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          height: 58,
          borderRadius: 16,
          backgroundColor: t.bg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: center || !arrow ? 'center' : 'space-between',
          paddingHorizontal: 20,
          gap: 10,
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={t.fg} />
      ) : (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {icon && <Ionicons name={icon} size={20} color={t.arrow} />}
            <T size={16} weight="600" color={t.fg}>{label}</T>
          </View>
          {arrow && !center && <Ionicons name="arrow-forward" size={20} color={t.arrow} />}
        </>
      )}
    </Pressable>
  );
}

interface OutlineProps {
  label: string;
  onPress?: () => void;
  dark?: boolean;
  icon?: IconName;
  height?: number;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export function OutlineButton({ label, onPress, dark, icon, height = 52, style, disabled }: OutlineProps) {
  const fg = dark ? night.paper : night.ink;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          height,
          borderRadius: 16,
          borderWidth: 1.5,
          borderColor: dark ? night.darkLine : night.ink,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingHorizontal: 14,
          opacity: disabled ? 0.45 : pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      {icon && <Ionicons name={icon} size={18} color={fg} />}
      <T size={15} weight="600" color={fg}>{label}</T>
    </Pressable>
  );
}

export function TextLink({ label, onPress, color = night.ink, muted, size = 14 }: { label: string; onPress?: () => void; color?: string; muted?: boolean; size?: number }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} hitSlop={10} style={{ alignSelf: 'center', paddingVertical: 6 }}>
      <T size={size} weight="600" color={muted ? night.muted : color} style={{ textDecorationLine: 'underline' }}>{label}</T>
    </Pressable>
  );
}

type CircleTone = 'light' | 'dark' | 'onColor' | 'ink';

// 44px round icon button (back, share, close...).
export function IconButton({ icon, onPress, tone = 'light', label, size = 20, children }: { icon?: IconName; onPress?: () => void; tone?: CircleTone; label: string; size?: number; children?: ReactNode }) {
  const bg = { light: night.card, dark: night.ink2, onColor: 'rgba(21,19,15,0.14)', ink: night.ink }[tone];
  const fg = tone === 'light' || tone === 'onColor' ? night.ink : night.paper;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({
        minWidth: 44,
        height: 44,
        paddingHorizontal: children ? 14 : 0,
        borderRadius: 999,
        backgroundColor: bg,
        borderWidth: tone === 'light' ? 1.5 : 0,
        borderColor: night.border,
        flexDirection: 'row',
        gap: 6,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      {icon && <Ionicons name={icon} size={size} color={fg} />}
      {children}
    </Pressable>
  );
}
