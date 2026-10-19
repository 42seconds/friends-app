import { Children, Fragment, ReactNode, useRef, useState } from 'react';
import { Animated, KeyboardTypeOptions, PanResponder, Pressable, StyleProp, TextInput, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import T from './T';
import { IconName } from './Buttons';
import { fonts, night } from '../../theme/night';

export function SectionLabel({ children, dark, right }: { children: ReactNode; dark?: boolean; right?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 }}>
      <T size={12} weight="600" ls={1} color={dark ? night.inkMuted : night.muted}>{children}</T>
      {right}
    </View>
  );
}

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  dot?: string;
  display?: boolean; // Bebas chip (Explore)
  dark?: boolean; // on an ink background
  activeColor?: string;
  icon?: IconName;
}

export function Chip({ label, active, onPress, dot, display, dark, activeColor, icon }: ChipProps) {
  const activeBg = activeColor ?? (dark ? night.paper : night.ink);
  const activeFg = activeColor ? night.ink : dark ? night.ink : night.paper;
  const fg = active ? activeFg : dark ? night.paper : night.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      style={({ pressed }) => ({
        height: display ? 40 : 38,
        paddingHorizontal: 14,
        borderRadius: 999,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        backgroundColor: active ? activeBg : dark ? 'transparent' : night.card,
        borderWidth: active ? 0 : 1.5,
        borderColor: dark ? night.darkLine : night.border,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      {dot && <View style={{ width: 9, height: 9, borderRadius: 99, backgroundColor: dot }} />}
      {icon && <Ionicons name={icon} size={14} color={fg} />}
      <T size={display ? 18 : 13} display={display} weight={active ? '700' : '500'} color={fg}>{label}</T>
    </Pressable>
  );
}

export function ChipRow({ children, wrap = true }: { children: ReactNode; wrap?: boolean }) {
  return <View style={{ flexDirection: 'row', flexWrap: wrap ? 'wrap' : 'nowrap', gap: 8 }}>{children}</View>;
}

// Sand-coloured segmented control (Upcoming · Pending · Past).
export function Segmented<K extends string>({ options, value, onChange, dark }: { options: { key: K; label: string }[]; value: K; onChange: (k: K) => void; dark?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', padding: 4, borderRadius: 14, backgroundColor: dark ? night.ink2 : night.sand }}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.key)}
            style={{ flex: 1, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? (dark ? night.paper : night.ink) : 'transparent' }}
          >
            <T size={14} weight={active ? '600' : '400'} color={active ? (dark ? night.ink : night.paper) : dark ? night.paper : night.ink}>{o.label}</T>
          </Pressable>
        );
      })}
    </View>
  );
}

// White rounded group with hairline dividers between rows.
export function ListGroup({ children, dark, style }: { children: ReactNode; dark?: boolean; style?: StyleProp<ViewStyle> }) {
  const items = Children.toArray(children).filter(Boolean);
  return (
    <View style={[{ borderRadius: 18, backgroundColor: dark ? night.ink3 : night.card, borderWidth: dark ? 0 : 1.5, borderColor: night.line, overflow: 'hidden' }, style]}>
      {items.map((child, i) => (
        <Fragment key={i}>
          {i > 0 && <View style={{ height: 1.5, backgroundColor: dark ? night.ink2 : night.divider, marginHorizontal: 14 }} />}
          {child}
        </Fragment>
      ))}
    </View>
  );
}

interface RowProps {
  title: string;
  subtitle?: string;
  icon?: IconName;
  iconBg?: string;
  iconColor?: string;
  right?: ReactNode;
  chevron?: boolean;
  onPress?: () => void;
  danger?: boolean;
  dark?: boolean;
}

export function ListRow({ title, subtitle, icon, iconBg = night.sand, iconColor, right, chevron, onPress, danger, dark }: RowProps) {
  const inner = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, minHeight: 52 }}>
      {icon && (
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: danger ? night.pink : iconBg, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icon} size={18} color={iconColor ?? (danger ? night.danger : night.ink)} />
        </View>
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <T size={15} weight="600" color={danger ? night.danger : dark ? night.paper : night.ink}>{title}</T>
        {!!subtitle && <T size={13} color={dark ? night.inkMuted : night.muted}>{subtitle}</T>}
      </View>
      {right}
      {chevron && <Ionicons name="chevron-forward" size={18} color={night.muted} />}
    </View>
  );
  if (!onPress) return inner;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
      {inner}
    </Pressable>
  );
}

export function Toggle({ value, onChange, label, disabled }: { value: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onChange(!value)}
      hitSlop={8}
      style={{ width: 50, height: 30, borderRadius: 99, backgroundColor: value ? night.ink : night.border, justifyContent: 'center', opacity: disabled ? 0.5 : 1 }}
    >
      <View style={{ position: 'absolute', top: 3, left: value ? 23 : 3, width: 24, height: 24, borderRadius: 99, backgroundColor: value ? night.lime : night.card }} />
    </Pressable>
  );
}

export function ToggleRow({ title, subtitle, value, onChange, dark }: { title: string; subtitle?: string; value: boolean; onChange: (v: boolean) => void; dark?: boolean }) {
  return <ListRow title={title} subtitle={subtitle} dark={dark} right={<Toggle value={value} onChange={onChange} label={title} />} />;
}

interface FieldProps {
  label?: string;
  value: string;
  onChangeText?: (t: string) => void;
  placeholder?: string;
  secure?: boolean;
  mono?: boolean;
  right?: ReactNode;
  left?: ReactNode;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  editable?: boolean;
  error?: string;
  dark?: boolean;
  hint?: string;
  labelRight?: ReactNode;
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
  maxLength?: number;
}

export function Field({ label, value, onChangeText, placeholder, secure, mono, right, left, keyboardType, autoCapitalize, multiline, editable = true, error, dark, hint, labelRight, autoFocus, onSubmitEditing, maxLength }: FieldProps) {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? night.danger : focused ? (dark ? night.paper : night.ink) : dark ? night.ink2 : night.border;
  return (
    <View style={{ gap: 8 }}>
      {(label || labelRight) && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          {label ? <T size={12} weight="600" ls={1} color={dark ? night.inkMuted : night.muted}>{label}</T> : <View />}
          {labelRight}
        </View>
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          gap: 8,
          minHeight: multiline ? 110 : 52,
          borderWidth: focused || error ? 2 : 1.5,
          borderColor,
          backgroundColor: dark ? night.ink3 : night.card,
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: multiline ? 12 : 0,
        }}
      >
        {left}
        <TextInput
          accessibilityLabel={label ?? placeholder}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={night.faint}
          secureTextEntry={secure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          editable={editable}
          autoFocus={autoFocus}
          onSubmitEditing={onSubmitEditing}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            minHeight: multiline ? 86 : 50,
            fontFamily: mono ? fonts.mono : fonts.regular,
            fontSize: 16,
            color: dark ? night.paper : night.ink,
            textAlignVertical: multiline ? 'top' : 'center',
          }}
        />
        {right}
      </View>
      {!!error && <T size={13} weight="600" color={night.danger}>{error}</T>}
      {!!hint && !error && <T size={12} color={dark ? night.inkMuted : night.muted}>{hint}</T>}
    </View>
  );
}

export function Stepper({ value, onChange, min = 0, max = 99 }: { value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: night.paper, borderRadius: 999, padding: 4 }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Remove one" disabled={value <= min} onPress={() => onChange(Math.max(min, value - 1))} style={{ width: 36, height: 36, borderRadius: 999, backgroundColor: night.card, alignItems: 'center', justifyContent: 'center', opacity: value <= min ? 0.4 : 1 }}>
        <T size={18}>−</T>
      </Pressable>
      <T mono weight="700" size={15} center style={{ width: 22 }}>{value}</T>
      <Pressable accessibilityRole="button" accessibilityLabel="Add one" disabled={value >= max} onPress={() => onChange(Math.min(max, value + 1))} style={{ width: 36, height: 36, borderRadius: 999, backgroundColor: night.ink, alignItems: 'center', justifyContent: 'center', opacity: value >= max ? 0.4 : 1 }}>
        <T size={18} color={night.paper}>+</T>
      </Pressable>
    </View>
  );
}

// "Slide to confirm" — nothing irreversible happens on a single tap.
export function SlideToConfirm({ label, onConfirm, danger, disabled }: { label: string; onConfirm: () => void; danger?: boolean; disabled?: boolean }) {
  const [width, setWidth] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  const knob = 52;
  const maxX = Math.max(0, width - knob - 12);
  const maxRef = useRef(maxX);
  maxRef.current = maxX;
  const confirmRef = useRef(onConfirm);
  confirmRef.current = onConfirm;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => x.setValue(Math.min(Math.max(0, g.dx), maxRef.current)),
      onPanResponderRelease: (_, g) => {
        if (g.dx >= maxRef.current * 0.9) {
          Animated.timing(x, { toValue: maxRef.current, duration: 80, useNativeDriver: false }).start(() => {
            confirmRef.current();
            setTimeout(() => x.setValue(0), 600);
          });
        } else {
          Animated.spring(x, { toValue: 0, useNativeDriver: false }).start();
        }
      },
    })
  ).current;

  const fill = danger ? night.danger : night.orange;
  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityActions={[{ name: 'activate', label }]}
      onAccessibilityAction={() => !disabled && onConfirm()}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ height: 64, borderRadius: 999, backgroundColor: danger ? night.dangerDark : night.ink, justifyContent: 'center', overflow: 'hidden', opacity: disabled ? 0.45 : 1 }}
    >
      <Animated.View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: Animated.add(x, knob + 12), backgroundColor: fill, borderRadius: 999 }} />
      <T size={16} weight="600" color={night.paper} center style={{ paddingLeft: 40 }}>{label}</T>
      <Animated.View
        {...(disabled ? {} : pan.panHandlers)}
        style={{ position: 'absolute', left: 6, top: 6, width: knob, height: knob, borderRadius: 999, backgroundColor: night.paper, alignItems: 'center', justifyContent: 'center', transform: [{ translateX: x }] }}
      >
        <Ionicons name="arrow-forward" size={20} color={night.ink} />
      </Animated.View>
    </View>
  );
}
