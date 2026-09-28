import { ReactNode } from 'react';
import { Image, Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import T from './T';
import { IconName } from './Buttons';
import { night } from '../../theme/night';
import { dateParts } from '../../lib/dates';
import { subBrandFor } from '../../lib/subbrands';

// The oversized "&" watermark that sits behind coloured blocks.
export function Amp({ size = 420, color, style }: { size?: number; color: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View pointerEvents="none" style={[{ position: 'absolute' }, style]}>
      <T display size={size} color={color} lh={0.8}>&amp;</T>
    </View>
  );
}

export function H1({ children, size = 52, color = night.ink }: { children: ReactNode; size?: number; color?: string }) {
  return <T display size={size} color={color} lh={0.9} accessibilityRole="header">{children}</T>;
}

export function H2({ children, size = 30, color = night.ink }: { children: ReactNode; size?: number; color?: string }) {
  return <T display size={size} color={color} accessibilityRole="header">{children}</T>;
}

const AVATAR_COLORS = [night.blue, night.lime, night.yellow, night.orange];

export function initials(name?: string) {
  const parts = (name ?? '?').trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?';
}

export function Avatar({ name, size = 40, color, ring = night.ink }: { name?: string; size?: number; color?: string; ring?: string }) {
  const bg = color ?? AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
  return (
    <View style={{ width: size, height: size, borderRadius: 999, backgroundColor: bg, borderWidth: 2, borderColor: ring, alignItems: 'center', justifyContent: 'center' }}>
      <T size={size * 0.38} weight="700">{initials(name)}</T>
    </View>
  );
}

export function Pill({ label, bg = night.sand, color = night.ink, mono }: { label: string; bg?: string; color?: string; mono?: boolean }) {
  return (
    <View style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: bg, alignSelf: 'flex-start' }}>
      <T size={mono ? 11 : 12} mono={mono} weight="700" color={color}>{label}</T>
    </View>
  );
}

// Small date badge (13 / SAT) that sits in the corner of an event thumbnail.
export function DateBadge({ date, time, large }: { date?: string; time?: string; large?: boolean }) {
  const p = dateParts(date, time);
  if (!p) return null;
  return (
    <View style={{ backgroundColor: night.paper, borderRadius: large ? 12 : 7, paddingHorizontal: large ? 10 : 5, paddingVertical: large ? 6 : 3, alignItems: 'center' }}>
      {large && <T mono weight="700" size={11}>{p.day}</T>}
      <T display size={large ? 34 : 17} lh={0.95}>{p.date}</T>
      <T mono weight="700" size={large ? 11 : 7}>{large ? p.month : p.day}</T>
    </View>
  );
}

// Coloured event thumbnail: event image if there is one, otherwise the
// sub-brand colour with its icon.
export function EventThumb({ image, tag, date, time, size = 64, radius = 14 }: { image?: string; tag?: string; date?: string; time?: string; size?: number; radius?: number }) {
  const brand = subBrandFor(tag);
  return (
    <View style={{ width: size, height: size, borderRadius: radius, backgroundColor: brand.color, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
      {image ? <Image source={{ uri: image }} style={{ position: 'absolute', width: '100%', height: '100%' }} /> : <Ionicons name={brand.icon} size={size * 0.4} color={night.ink} style={{ opacity: 0.35 }} />}
      {date !== undefined && (
        <View style={{ position: 'absolute', left: 4, bottom: 4 }}>
          <DateBadge date={date} time={time} />
        </View>
      )}
    </View>
  );
}

export function EventRow({ title, subtitle, image, tag, date, time, right, onPress, highlight }: { title: string; subtitle?: string; image?: string; tag?: string; date?: string; time?: string; right?: ReactNode; onPress?: () => void; highlight?: ReactNode }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({ flexDirection: 'row', gap: 14, alignItems: 'center', padding: 10, backgroundColor: night.card, borderRadius: 18, borderWidth: 1.5, borderColor: night.line, opacity: pressed ? 0.8 : 1 })}
    >
      <EventThumb image={image} tag={tag} date={date} time={time} />
      <View style={{ flex: 1, gap: 3 }}>
        {highlight ?? <T size={16} weight="600" numberOfLines={2}>{title}</T>}
        {!!subtitle && <T size={13} color={night.muted} numberOfLines={1}>{subtitle}</T>}
      </View>
      {right ?? <Ionicons name="chevron-forward" size={18} color={night.muted} />}
    </Pressable>
  );
}

// Dark rounded note with an icon — "We hold your tickets for 24 hours".
export function Note({ icon = 'time-outline', children, tone = 'dark', iconColor }: { icon?: IconName; children: ReactNode; tone?: 'dark' | 'cream' | 'pink' | 'white' | 'warn'; iconColor?: string }) {
  const palette = {
    dark: { bg: night.ink, fg: night.paper, icon: night.lime },
    cream: { bg: night.cream, fg: night.ink, icon: night.ink },
    pink: { bg: night.pink, fg: night.ink, icon: night.danger },
    white: { bg: night.card, fg: night.ink, icon: night.ink },
    warn: { bg: night.warnDark, fg: night.paper, icon: night.yellow },
  }[tone];
  return (
    <View style={{ flexDirection: 'row', gap: 12, padding: 14, paddingHorizontal: 16, borderRadius: 18, backgroundColor: palette.bg, borderWidth: tone === 'white' ? 1.5 : 0, borderColor: night.line }}>
      <Ionicons name={icon} size={22} color={iconColor ?? palette.icon} />
      <View style={{ flex: 1 }}>{typeof children === 'string' ? <T size={14} lh={1.5} color={palette.fg}>{children}</T> : children}</View>
    </View>
  );
}

export type StepState = 'done' | 'current' | 'todo';

// Vertical progress tracker (reserve -> proof -> verifying -> QR).
export function Timeline({ steps, dark }: { steps: { label: string; sub?: string; state: StepState }[]; dark?: boolean }) {
  return (
    <View style={{ gap: 0 }}>
      {steps.map((s, i) => {
        const last = i === steps.length - 1;
        const dotBg = s.state === 'done' ? night.ink : s.state === 'current' ? night.yellow : 'transparent';
        return (
          <View key={i} style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ alignItems: 'center', width: 26 }}>
              <View style={{ width: 26, height: 26, borderRadius: 99, backgroundColor: dotBg, borderWidth: s.state === 'todo' ? 2 : 0, borderColor: night.border, alignItems: 'center', justifyContent: 'center' }}>
                {s.state === 'done' && <Ionicons name="checkmark" size={15} color={night.lime} />}
                {s.state === 'current' && <View style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: night.ink }} />}
              </View>
              {!last && <View style={{ width: 2, flex: 1, minHeight: 18, backgroundColor: s.state === 'done' ? night.ink : night.border }} />}
            </View>
            <View style={{ flex: 1, paddingBottom: last ? 0 : 14, gap: 2, paddingTop: 3 }}>
              <T size={15} weight={s.state === 'todo' ? '500' : '600'} color={s.state === 'todo' ? night.muted : dark ? night.paper : night.ink}>{s.label}</T>
              {!!s.sub && <T size={13} color={night.muted} mono={/^\d\d:\d\d$/.test(s.sub) || /^[A-Z]{3} /.test(s.sub)}>{s.sub}</T>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// "STEP 2 OF 4" + four segments: Tickets · Review · Pay · Ticket
export function StepProgress({ step, dark, label }: { step: 1 | 2 | 3 | 4; dark?: boolean; label?: string }) {
  const names = ['Tickets', 'Review', 'Pay', 'Ticket'];
  return (
    <View style={{ gap: 8 }}>
      <T mono weight="700" size={11} color={dark ? night.inkMuted : night.muted}>{label ?? `STEP ${step} OF 4`}</T>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {names.map((n, i) => {
          const on = i < step;
          return (
            <View key={n} style={{ flex: 1, gap: 5 }}>
              <View style={{ height: 4, borderRadius: 99, backgroundColor: on ? (dark ? night.paper : night.ink) : dark ? night.darkLine : night.border }} />
              <T size={11} weight={on ? '600' : '400'} color={on ? (dark ? night.paper : night.ink) : night.muted}>{n}</T>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function QR({ value, size = 180 }: { value: string; size?: number }) {
  return (
    <View style={{ padding: 12, backgroundColor: night.card, borderRadius: 16 }}>
      <QRCode value={value} size={size} color={night.ink} backgroundColor={night.card} />
    </View>
  );
}

export function KV({ k, v, strong, dark, mono = true }: { k: string; v: string; strong?: boolean; dark?: boolean; mono?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
      <T size={14} weight={strong ? '600' : '400'} color={strong ? (dark ? night.paper : night.ink) : dark ? night.inkMuted : night.muted}>{k}</T>
      <T size={strong ? 16 : 14} mono={mono} weight={strong ? '700' : '500'} color={dark ? night.paper : night.ink} style={{ flexShrink: 1, textAlign: 'right' }}>{v}</T>
    </View>
  );
}

// Centered illustration + title + copy + CTA for empty and system states.
export function EmptyState({ icon, title, body, children, tileBg = night.card, iconColor = night.ink, dark }: { icon: IconName; title: string; body: string; children?: ReactNode; tileBg?: string; iconColor?: string; dark?: boolean }) {
  return (
    <View style={{ alignItems: 'center', gap: 14, paddingVertical: 28 }}>
      <View style={{ width: 120, height: 120, borderRadius: 32, backgroundColor: tileBg, borderWidth: tileBg === night.card ? 1.5 : 0, borderColor: night.line, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={52} color={iconColor} />
      </View>
      <H1 size={44} color={dark ? night.paper : night.ink}>{title}</H1>
      <T size={15} lh={1.5} center color={dark ? night.inkMuted : night.muted} style={{ maxWidth: 300 }}>{body}</T>
      {children && <View style={{ alignSelf: 'stretch', gap: 10, marginTop: 6 }}>{children}</View>}
    </View>
  );
}

// Faint card used for dashed "placeholder" content (e.g. unknown venue data).
export function Card({ children, dark, style, pad = 16 }: { children: ReactNode; dark?: boolean; style?: StyleProp<ViewStyle>; pad?: number }) {
  return <View style={[{ padding: pad, borderRadius: 20, backgroundColor: dark ? night.ink : night.card, borderWidth: dark ? 0 : 1.5, borderColor: night.line, gap: 10 }, style]}>{children}</View>;
}
