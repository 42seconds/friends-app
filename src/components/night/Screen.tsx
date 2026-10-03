import { createContext, ReactNode, useContext, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, RefreshControlProps, ScrollView, StyleProp, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { night } from '../../theme/night';
import { IconButton, IconName } from './Buttons';
import { safeBack } from '../../lib/nav';

// True inside a Screen that has a pinned header: Hero then skips the
// safe-area top padding because the header already covers it.
const HeaderContext = createContext(false);

interface ScreenProps {
  children: ReactNode;
  header?: ReactNode; // pinned to the top, stays visible while content scrolls
  headerBg?: string; // defaults to the screen background
  bg?: string;
  dark?: boolean; // light status bar text
  footer?: ReactNode; // pinned to the bottom (CTA bar)
  footerDark?: boolean;
  hero?: ReactNode; // full-bleed block above the padded content
  scroll?: boolean;
  gap?: number;
  padTop?: boolean; // add safe-area top padding to content (false when hero handles it)
  tabBar?: boolean; // leave room for the floating tab bar
  contentStyle?: StyleProp<ViewStyle>;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  fill?: boolean; // stretch content to the full height (for bottom-anchored links)
}

// Standard Braam Night+ page: paper background, 20px gutters, 16px rhythm,
// optional full-bleed hero and a pinned footer CTA bar.
export default function Screen({
  children,
  bg = night.paper,
  dark,
  footer,
  footerDark,
  hero,
  scroll = true,
  gap = 16,
  padTop = true,
  tabBar,
  contentStyle,
  refreshControl,
  fill,
  header,
  headerBg,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const [scrolled, setScrolled] = useState(false);
  const barBg = headerBg ?? bg;
  const barDark = barBg === night.ink || barBg === night.inkDeep || barBg === night.danger;
  const bottomPad = tabBar ? 110 + insets.bottom : footer ? 24 : 40 + insets.bottom;
  const content = (
    <>
      {hero}
      <View style={[{ flexGrow: fill ? 1 : undefined, paddingHorizontal: 20, paddingTop: header ? (hero ? 20 : 8) : padTop && !hero ? insets.top + 12 : hero ? 20 : 0, paddingBottom: bottomPad, gap }, contentStyle]}>
        {children}
      </View>
    </>
  );
  return (
    <HeaderContext.Provider value={!!header}>
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style={(header ? barDark : dark) ? 'light' : 'dark'} />
      {header && (
        <View
          style={{
            paddingTop: insets.top + 8,
            paddingHorizontal: 20,
            paddingBottom: 10,
            gap: 12,
            backgroundColor: barBg,
            borderBottomWidth: 1.5,
            borderBottomColor: scrolled && barBg === bg ? (barDark ? night.ink2 : night.line) : 'transparent',
            zIndex: 2,
          }}
        >
          {header}
        </View>
      )}
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
          contentContainerStyle={fill ? { flexGrow: 1 } : undefined}
          scrollEventThrottle={32}
          onScroll={header ? (e) => setScrolled(e.nativeEvent.contentOffset.y > 4) : undefined}
        >
          {content}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{content}</View>
      )}
      {footer && (
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 14,
            paddingBottom: Math.max(insets.bottom, 14) + 6,
            backgroundColor: footerDark ? night.ink : bg,
            borderTopWidth: footerDark ? 0 : 1.5,
            borderTopColor: night.line,
            gap: 10,
          }}
        >
          {footer}
        </View>
      )}
    </KeyboardAvoidingView>
    </HeaderContext.Provider>
  );
}

// Top row with a back button on the left and optional content on the right.
export function TopBar({ dark, onColor, right, center, onBack, icon = 'arrow-back' }: { dark?: boolean; onColor?: boolean; right?: ReactNode; center?: ReactNode; onBack?: () => void; icon?: IconName }) {
  const router = useRouter();
  const back = onBack ?? (() => safeBack(router, '/(tabs)/home'));
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44 }}>
      <IconButton icon={icon} label="Back" tone={onColor ? 'onColor' : dark ? 'dark' : 'light'} onPress={back} />
      {center}
      {right ?? <View style={{ width: 44 }} />}
    </View>
  );
}

// Coloured, full-bleed header block (orange/blue/ink) used by many screens.
export function Hero({ bg, children, gap = 12, pb = 26 }: { bg: string; children: ReactNode; gap?: number; pb?: number }) {
  const insets = useSafeAreaInsets();
  const pinned = useContext(HeaderContext);
  return (
    <View style={{ backgroundColor: bg, paddingTop: pinned ? 4 : insets.top + 12, paddingHorizontal: 20, paddingBottom: pb, overflow: 'hidden', gap }}>
      {children}
    </View>
  );
}

// Bottom-sheet presentation for routes registered as transparent modals:
// dimmed backdrop (tap to close) plus a paper sheet with a grab handle.
export function Sheet({ children, footer, onClose }: { children: ReactNode; footer?: ReactNode; onClose?: () => void }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const close = onClose ?? (() => safeBack(router));
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="light" />
      <Pressable accessibilityLabel="Close" onPress={close} style={{ flex: 1, backgroundColor: 'rgba(21,19,15,0.6)' }} />
      <View style={{ backgroundColor: night.paper, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '88%' }}>
        <View style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 99, backgroundColor: night.handle, marginTop: 10 }} />
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingTop: 14, gap: 14 }} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
        {footer && <View style={{ paddingHorizontal: 20, paddingBottom: Math.max(insets.bottom, 14) + 6, gap: 10 }}>{footer}</View>}
      </View>
    </KeyboardAvoidingView>
  );
}
