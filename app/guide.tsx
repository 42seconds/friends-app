import { ReactNode, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Pressable, ScrollView, useWindowDimensions, View, ViewStyle } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { T, QR } from '../src/components/night';
import { useOnboarding } from '../src/context/OnboardingContext';
import { night } from '../src/theme/night';
import { HOLD_HOURS, MAX_TICKETS_PER_PERSON } from '../src/config/pricing';
import { safeBack } from '../src/lib/nav';

// "How &FRIENDS works": the 9-step first-time guide (Design: e-guide-1…9).
// Shown once after the first login on this phone, and any time from Help.
// Each step is a storybook card on a colour field with numbered bubbles
// pointing at the exact buttons people will tap later.

const CW = 350, CH = 360; // the illustration canvas, scaled to the screen
const shadow: ViewStyle = { shadowColor: '#15130F', shadowOpacity: 0.22, shadowRadius: 20, shadowOffset: { width: 0, height: 18 }, elevation: 10 };

let reduceMotion = false;
AccessibilityInfo.isReduceMotionEnabled().then((v) => (reduceMotion = v)).catch(() => {});

// Lime ring that pulses around whatever it's placed in.
function Ring({ radius = 12, inset = -5 }: { radius?: number; inset?: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(Animated.timing(v, { toValue: 1, duration: 1200, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <>
      <View pointerEvents="none" style={{ position: 'absolute', top: inset, left: inset, right: inset, bottom: inset, borderRadius: radius, borderWidth: 3, borderColor: night.lime }} />
      <Animated.View pointerEvents="none" style={{ position: 'absolute', top: inset, left: inset, right: inset, bottom: inset, borderRadius: radius, borderWidth: 3, borderColor: night.lime,
        opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) }] }} />
    </>
  );
}

// Ink speech bubble with a number badge and a little tail.
function Bubble({ n, children, style, tail, width }: { n?: number; children: ReactNode; style: ViewStyle; tail: { side: 'top' | 'bottom' | 'left' | 'right'; at: number }; width?: number }) {
  const t: ViewStyle = { position: 'absolute', width: 12, height: 12, backgroundColor: night.ink, transform: [{ rotate: '45deg' }] };
  const tailStyle: ViewStyle =
    tail.side === 'top' ? { top: -5, left: tail.at } : tail.side === 'bottom' ? { bottom: -5, left: tail.at } : tail.side === 'left' ? { left: -5, top: tail.at } : { right: -5, top: tail.at };
  return (
    <View style={[{ position: 'absolute', zIndex: 5, backgroundColor: night.ink, borderRadius: 16, paddingVertical: 9, paddingHorizontal: 12, flexDirection: 'row', gap: 8, alignItems: 'center', width }, shadow, style]}>
      <View style={[t, tailStyle]} />
      {n !== undefined && (
        <View style={{ width: 22, height: 22, borderRadius: 99, backgroundColor: night.lime, alignItems: 'center', justifyContent: 'center' }}>
          <T mono size={12} weight="700">{n}</T>
        </View>
      )}
      <T size={13} lh={1.3} weight="500" color={night.paper} style={width ? { flex: 1 } : undefined}>{children}</T>
    </View>
  );
}

const Card = ({ style, children }: { style: ViewStyle; children?: ReactNode }) => (
  <View style={[{ position: 'absolute', backgroundColor: night.paper, borderRadius: 26 }, shadow, style]}>{children}</View>
);

// ---- the nine illustrations ---------------------------------------------------------
function Art1() {
  const chip = (label: string, bg: string, style: ViewStyle) => (
    <View style={[{ position: 'absolute', backgroundColor: bg, borderRadius: 18, paddingVertical: 6, paddingHorizontal: 14 }, style]}>
      <T display size={28}>{label}</T>
    </View>
  );
  return (
    <>
      <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
        <T display size={320} color={night.paper} style={{ lineHeight: 300, paddingTop: 50, textShadowColor: '#E84313', textShadowOffset: { width: 0, height: 14 }, textShadowRadius: 0 }}>&amp;</T>
      </View>
      {chip('Gigs', night.paper, { left: 6, top: 40, transform: [{ rotate: '-8deg' }] })}
      {chip('Talks', night.blue, { right: 4, top: 110, transform: [{ rotate: '7deg' }] })}
      {chip('Markets', night.yellow, { left: 30, bottom: 30, transform: [{ rotate: '5deg' }] })}
    </>
  );
}

function Art2() {
  return (
    <>
      <Card style={{ left: 8, top: 20, width: 334, height: 320, transform: [{ rotate: '-2deg' }], padding: 16, gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <T display size={30}>This week in Braam</T>
          <View style={{ width: 34, height: 34, borderRadius: 99, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="search" size={16} color={night.ink} /><Ring radius={20} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 6, alignSelf: 'flex-start' }}>
          {[['&Music', night.orange], ['&Talk', night.blue], ['&Fun', night.lime]].map(([l, c]) => (
            <View key={l} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#fff', borderRadius: 99, paddingHorizontal: 10, height: 28 }}>
              <View style={{ width: 8, height: 8, borderRadius: 9, backgroundColor: c }} /><T display size={16}>{l}</T>
            </View>
          ))}
          <Ring radius={18} />
        </View>
        <View style={{ height: 170, borderRadius: 20, backgroundColor: '#3A1A0E', overflow: 'hidden', justifyContent: 'flex-end', padding: 14 }}>
          <View style={{ position: 'absolute', right: 30, top: 18, width: 120, height: 120, borderRadius: 99, backgroundColor: night.orange }} />
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
            <T display size={30} color={night.paper}>Braam After Dark</T>
            <T mono size={10} weight="700" color={night.paper}>FROM R181.13</T>
          </View>
          <Ring radius={22} inset={-4} />
        </View>
      </Card>
      <Bubble n={1} style={{ left: 30, top: 288 }} tail={{ side: 'top', at: 30 }}>Tap any event to see the details</Bubble>
      <Bubble n={2} style={{ left: 30, top: 116 }} tail={{ side: 'top', at: 40 }}>Filter by what you're into</Bubble>
      <Bubble n={3} style={{ right: 4, top: -12 }} tail={{ side: 'bottom', at: 150 }}>Or search by name or venue</Bubble>
    </>
  );
}

function Art3() {
  const row = (name: string, price: string, qty: number, hot: boolean) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 16, backgroundColor: '#fff', borderWidth: hot ? 2 : 1.5, borderColor: hot ? night.ink : night.line }}>
      <View style={{ flex: 1 }}>
        <T size={15} weight="600">{name}</T>
        <View style={{ alignSelf: 'flex-start' }}><T mono size={14} weight="700">{price}</T>{hot && <Ring radius={8} />}</View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: night.paper, borderRadius: 99, padding: 3 }}>
        <View style={{ width: 32, height: 32, borderRadius: 99, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}><T size={17}>−</T></View>
        <T mono weight="700" style={{ width: 18, textAlign: 'center' }}>{qty}</T>
        <View style={{ width: 32, height: 32, borderRadius: 99, backgroundColor: night.ink, alignItems: 'center', justifyContent: 'center' }}><T size={17} color={night.paper}>+</T>{hot && <Ring radius={99} />}</View>
      </View>
    </View>
  );
  return (
    <>
      <Card style={{ left: 8, top: 20, width: 334, height: 300, transform: [{ rotate: '2deg' }], padding: 16, gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <T display size={30}>Tickets</T><T size={11} color={night.muted}>Fees + VAT included</T>
        </View>
        {row('General Admission', 'R181.13', 1, true)}
        {row('VIP', 'R362.25', 0, false)}
        <View style={{ marginTop: 26, height: 52, borderRadius: 16, backgroundColor: night.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 }}>
          <T size={15} weight="600" color={night.paper}>Reserve tickets</T>
          <Ionicons name="arrow-forward" size={20} color={night.orange} />
          <Ring radius={20} />
        </View>
      </Card>
      <Bubble n={1} style={{ left: 120, top: 6 }} tail={{ side: 'bottom', at: 168 }}>{`Choose how many (up to ${MAX_TICKETS_PER_PERSON})`}</Bubble>
      <Bubble n={2} style={{ left: 0, top: 156 }} width={200} tail={{ side: 'top', at: 50 }}>Full price: fees and VAT included</Bubble>
      <Bubble n={3} style={{ left: 150, top: 322 }} tail={{ side: 'top', at: 40 }}>Then tap Reserve</Bubble>
    </>
  );
}

function Art4() {
  return (
    <View style={[{ position: 'absolute', left: 35, top: 20, width: 280, height: 280, borderRadius: 140, backgroundColor: night.paper, borderWidth: 10, borderColor: night.ink, alignItems: 'center', justifyContent: 'center', gap: 6 }, shadow]}>
      <View style={{ position: 'absolute', top: -38, width: 52, height: 26, borderTopLeftRadius: 10, borderTopRightRadius: 10, backgroundColor: night.ink }} />
      <View style={{ width: 110, height: 66, borderRadius: 12, backgroundColor: night.orange, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ position: 'absolute', left: -9, top: 24, width: 18, height: 18, borderRadius: 99, backgroundColor: night.paper }} />
        <View style={{ position: 'absolute', right: -9, top: 24, width: 18, height: 18, borderRadius: 99, backgroundColor: night.paper }} />
        <Ionicons name="lock-closed-outline" size={28} color={night.ink} />
      </View>
      <T mono size={40} weight="700">23:59:59</T>
      <T mono size={11} weight="700" color={night.muted}>HELD FOR YOU</T>
    </View>
  );
}

function Art5() {
  const line = (label: string, value: string, opts: { copy?: boolean; hot?: boolean } = {}) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 14, borderBottomWidth: 1.5, borderBottomColor: '#EFEAE0' }}>
      <View style={{ flex: 1 }}><T size={10} weight="700" color={night.muted}>{label}</T><T mono size={13} weight="700">{value}</T></View>
      {opts.copy && <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: night.paper, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="copy-outline" size={14} color={night.ink} />{opts.hot && <Ring radius={12} />}</View>}
    </View>
  );
  return (
    <>
      <Card style={{ left: 8, top: 30, width: 334, height: 268, transform: [{ rotate: '-1.5deg' }], overflow: 'hidden' }}>
        <View style={{ backgroundColor: night.orange, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View><T mono size={10} weight="700">AMOUNT TO PAY</T><T display size={34}>R362.25</T><Ring radius={10} /></View>
          <View style={{ height: 32, paddingHorizontal: 10, borderRadius: 99, backgroundColor: night.ink, flexDirection: 'row', alignItems: 'center', gap: 4 }}><Ionicons name="copy-outline" size={12} color={night.paper} /><T size={12} weight="600" color={night.paper}>Copy</T></View>
        </View>
        <View style={{ backgroundColor: '#fff' }}>
          {line('Bank', 'Your bank details')}
          {line('Account number', '•••• •••• ••', { copy: true, hot: true })}
          {line('Branch code', '••••••', { copy: true })}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 14, backgroundColor: '#FFF6D6' }}>
            <View style={{ flex: 1 }}><T size={10} weight="700" color={night.muted}>Reference · use exactly this</T><T mono size={17} weight="700">TKT-AB12CD34</T></View>
            <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: night.ink, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="copy-outline" size={14} color={night.paper} /></View>
            <Ring radius={14} inset={3} />
          </View>
        </View>
      </Card>
      <Bubble n={1} style={{ left: 30, top: 304 }} width={270} tail={{ side: 'top', at: 200 }}>Use this exact reference, so we can find your payment</Bubble>
      <Bubble n={2} style={{ left: 96, top: 108 }} width={196} tail={{ side: 'right', at: 20 }}>Tap to copy, then paste into your banking app</Bubble>
      <Bubble n={3} style={{ left: 160, top: 0 }} tail={{ side: 'left', at: 12 }}>Pay this exact amount</Bubble>
    </>
  );
}

function Art6() {
  return (
    <>
      <View style={[{ position: 'absolute', left: 10, top: 14, width: 150, height: 230, borderRadius: 22, backgroundColor: night.ink, padding: 8, transform: [{ rotate: '-9deg' }] }, shadow]}>
        <View style={{ flex: 1, borderRadius: 15, backgroundColor: '#fff', paddingVertical: 14, paddingHorizontal: 10, alignItems: 'center', gap: 8 }}>
          <View style={{ width: 40, height: 40, borderRadius: 99, backgroundColor: '#D6F5C8', alignItems: 'center', justifyContent: 'center' }}><Ionicons name="checkmark" size={22} color="#1E5B0F" /></View>
          <T size={11} weight="700">Payment successful</T>
          <T mono size={11} weight="700">R362.25</T>
          <T mono size={9} color={night.muted}>TKT-AB12CD34</T>
          <View style={{ height: 4, width: '80%', backgroundColor: '#E8E3D7' }} /><View style={{ height: 4, width: '60%', backgroundColor: '#E8E3D7' }} />
        </View>
      </View>
      <View style={{ position: 'absolute', left: 150, top: 70, flexDirection: 'row', gap: 6, transform: [{ rotate: '-20deg' }] }}>
        {[0, 1, 2, 3, 4, 5].map((i) => <View key={i} style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: night.ink }} />)}
      </View>
      <Card style={{ right: 6, top: 86, width: 180, padding: 14, gap: 10 }}>
        <T display size={22}>Proof of payment</T>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['camera-outline', 'image-outline'] as const).map((i) => (
            <View key={i} style={{ flex: 1, height: 44, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#BDB5A4', alignItems: 'center', justifyContent: 'center' }}><Ionicons name={i} size={20} color={night.ink} /></View>
          ))}
        </View>
        <View style={{ height: 46, borderRadius: 14, backgroundColor: night.ink, alignItems: 'center', justifyContent: 'center' }}>
          <T size={13} weight="600" color={night.paper}>Upload proof of payment</T><Ring radius={18} />
        </View>
      </Card>
      <Bubble n={1} style={{ left: 150, top: 286 }} tail={{ side: 'top', at: 110 }}>Tap here after you've paid</Bubble>
      <Bubble n={2} style={{ left: 140, top: -6 }} width={210} tail={{ side: 'bottom', at: 110 }}>Take a photo or choose a screenshot</Bubble>
    </>
  );
}

function Art7() {
  const step = (label: string, state: 'done' | 'now' | 'todo') => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <View style={{ width: 32, height: 32, borderRadius: 99, alignItems: 'center', justifyContent: 'center', backgroundColor: state === 'done' ? night.ink : state === 'now' ? night.yellow : 'transparent', borderWidth: state === 'todo' ? 2 : state === 'now' ? 3 : 0, borderColor: state === 'now' ? night.ink : night.faint, borderStyle: state === 'todo' ? 'dashed' : 'solid' }}>
        {state === 'done' && <Ionicons name="checkmark" size={16} color={night.lime} />}
        {state === 'now' && <Ionicons name="time-outline" size={16} color={night.ink} />}
      </View>
      <T size={state === 'now' ? 17 : 15} weight={state === 'todo' ? '500' : '700'} color={state === 'todo' ? night.faint : night.ink}>{label}</T>
    </View>
  );
  return (
    <Card style={{ left: 22, top: 20, width: 296, height: 320, transform: [{ rotate: '-2deg' }], paddingHorizontal: 24, justifyContent: 'center', gap: 38 }}>
      {step('Tickets reserved', 'done')}
      {step('Proof received', 'done')}
      {step('Team is checking', 'now')}
      {step('QR ticket ready', 'todo')}
    </Card>
  );
}

function Art8() {
  return (
    <>
      <View style={[{ position: 'absolute', left: 10, right: 10, top: 2, borderRadius: 18, backgroundColor: 'rgba(243,240,232,0.96)', padding: 12, flexDirection: 'row', gap: 10, alignItems: 'center' }, shadow]}>
        <View style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: night.orange, alignItems: 'center', justifyContent: 'center' }}><T display size={24} style={{ marginTop: 3 }}>&amp;</T></View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><T size={10} color={night.muted}>&amp;FRIENDS</T><T size={10} color={night.muted}>now</T></View>
          <T size={13} weight="700">Your tickets are ready 🎉</T>
          <T size={11} color={night.body}>Payment approved for Braam After Dark.</T>
        </View>
      </View>
      <Card style={{ left: 65, top: 104, width: 210, height: 180, transform: [{ rotate: '4deg' }], overflow: 'hidden' }}>
        <View style={{ backgroundColor: night.orange, paddingHorizontal: 14, paddingVertical: 10 }}><T display size={24}>Braam After Dark</T></View>
        <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}><QR value="TKT-AB12CD34" size={100} /></View>
      </Card>
      {[[30, 120, night.orange], [300, 110, night.blue], [20, 220, night.lime], [310, 260, night.orange], [130, 90, night.yellow]].map(([x, y, c], i) => (
        <View key={i} style={{ position: 'absolute', left: x as number, top: y as number, width: 10, height: 6, backgroundColor: c as string, transform: [{ rotate: `${i * 37}deg` }] }} />
      ))}
      <View style={{ position: 'absolute', left: 30, right: 30, top: 300, height: 52, borderRadius: 18, backgroundColor: night.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>
        {(['home-outline', 'ticket-outline', 'heart-outline', 'person-outline'] as const).map((i, k) => (
          <View key={i} style={{ width: 46, height: 36, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={i} size={18} color={night.paper} />{k === 1 && <Ring radius={10} inset={0} />}
          </View>
        ))}
      </View>
      <Bubble style={{ left: 150, top: 256 }} tail={{ side: 'bottom', at: 20 }}>Your tickets live here</Bubble>
    </>
  );
}

function Art9() {
  return (
    <>
      <View style={{ position: 'absolute', left: 40, top: 30, width: 70, height: 70, borderRadius: 99, backgroundColor: night.ink }} />
      <View style={{ position: 'absolute', left: 10, top: 106, width: 130, height: 200, borderTopLeftRadius: 60, borderTopRightRadius: 60, backgroundColor: night.ink }}>
        <View style={{ position: 'absolute', left: 30, top: 50, width: 50, height: 8, borderRadius: 4, backgroundColor: night.orange }} />
      </View>
      <View style={{ position: 'absolute', left: 140, top: 180, flexDirection: 'row', gap: 4 }}>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <View key={i} style={{ width: 8, height: 4, backgroundColor: night.lime }} />)}
      </View>
      <View style={[{ position: 'absolute', right: 20, top: 60, width: 130, height: 230, borderRadius: 24, backgroundColor: night.ink, padding: 8, transform: [{ rotate: '12deg' }] }, shadow]}>
        <View style={{ flex: 1, borderRadius: 17, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <QR value="TKT-AB12CD34" size={86} /><T mono size={8} weight="700">TKT-AB12CD34</T>
        </View>
      </View>
      <View style={[{ position: 'absolute', left: 120, top: 10, width: 90, height: 90, borderRadius: 99, backgroundColor: '#1F9D45', borderWidth: 6, borderColor: night.paper, alignItems: 'center', justifyContent: 'center' }, shadow]}>
        <Ionicons name="checkmark" size={48} color={night.paper} />
      </View>
    </>
  );
}

// ---- copy -----------------------------------------------------------------------------
interface Step { bg: string; title: string; body: ReactNode; art: () => ReactNode; extra?: ReactNode; arrow?: string }
const STEPS: Step[] = [
  { bg: night.orange, title: 'Welcome to &Friends', body: "Braamfontein's events, all in one place. Here's how to get your first ticket, it takes 1 minute.", art: Art1, arrow: night.lime },
  { bg: night.blue, title: 'Find a night out', body: 'Everything on in Braam this week. Tap an event that looks good.', art: Art2 },
  { bg: night.lime, title: 'Pick your tickets', body: 'Choose the ticket type and how many. What you see is what you pay.', art: Art3 },
  { bg: night.yellow, title: `We hold them for ${HOLD_HOURS} hours`, body: `Once you reserve, your tickets are kept for you for ${HOLD_HOURS} hours while you pay. No one else can take them.`, art: Art4,
    extra: <View style={{ padding: 12, borderRadius: 14, backgroundColor: night.paper }}><T size={13} lh={1.4}>If the timer runs out before you pay, the tickets go back on sale.</T></View> },
  { bg: night.orange, title: 'Pay by EFT', body: "Open your banking app and pay the amount shown, using your reference. We don't take card payments.", art: Art5, arrow: night.lime,
    extra: <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', padding: 12, borderRadius: 14, backgroundColor: night.lime }}><Ionicons name="checkmark" size={18} color={night.ink} /><T size={13}>Your reference looks like <T mono size={13} weight="700">TKT-AB12CD34</T></T></View> },
  { bg: night.blue, title: 'Upload your proof', body: "After paying, screenshot the bank's confirmation and upload it as your proof of payment. People forget this step, and without it we can't approve your tickets.", art: Art6,
    extra: <View style={{ alignSelf: 'flex-start', paddingVertical: 7, paddingHorizontal: 12, borderRadius: 99, backgroundColor: night.orange }}><T size={13} weight="700">⚠️ No proof = no ticket</T></View> },
  { bg: night.lime, title: 'We check your payment', body: "Our team matches your proof to the payment, usually within a few hours. You can close the app; we'll let you know.", art: Art7,
    extra: <View style={{ padding: 12, borderRadius: 14, backgroundColor: night.paper }}><T size={13} lh={1.4}>If something's wrong, like the wrong amount, we'll tell you why and you can upload a new proof. Your tickets stay held.</T></View> },
  { bg: night.yellow, title: 'Your QR is ready', body: <>When we approve your payment you get a notification, and your QR ticket appears in <T size={15} weight="700">Tickets</T>. That's your entry.</>, art: Art8 },
  { bg: night.orange, title: 'Show it at the door', body: 'Open your ticket, turn up your brightness, and the team scans you in. One QR covers everyone on your booking.', art: Art9, arrow: night.lime,
    extra: (
      <View style={{ gap: 8 }}>
        {[['cellular-outline', 'Open your ticket before you arrive, in case signal is bad'], ['ticket-outline', "Can't go? Send the ticket to a friend from the ticket screen"], ['id-card-outline', 'Night events are 18+: bring ID']].map(([i, t]) => (
          <View key={t} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: night.paper, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={i as any} size={15} color={night.ink} /></View>
            <T size={13} style={{ flex: 1 }}>{t}</T>
          </View>
        ))}
      </View>
    ) },
];

export default function GuideScreen() {
  const router = useRouter();
  const { replay } = useLocalSearchParams<{ replay?: string }>();
  const { markGuideSeen, markOnboardingSeen } = useOnboarding();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scroller = useRef<ScrollView>(null);
  const [i, setI] = useState(0);
  const scale = Math.min(1, (width - 40) / CW, (height - 470) / CH);

  const finish = async () => {
    await markGuideSeen();
    markOnboardingSeen().catch(() => {});
    if (replay) safeBack(router, '/settings/help');
    else router.replace('/(tabs)/home');
  };
  const goTo = (n: number) => {
    scroller.current?.scrollTo({ x: n * width, animated: !reduceMotion });
    setI(n);
  };

  return (
    <ScrollView
      ref={scroller}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      onMomentumScrollEnd={(e) => setI(Math.round(e.nativeEvent.contentOffset.x / width))}
      style={{ flex: 1, backgroundColor: STEPS[i].bg }}
    >
      {STEPS.map((s, n) => {
        const Art = s.art;
        const last = n === STEPS.length - 1;
        return (
          <View key={n} style={{ width, height, backgroundColor: s.bg, paddingTop: insets.top + 14, paddingBottom: insets.bottom + 20 }} accessibilityLabel={`Step ${n + 1} of ${STEPS.length}`}>
            <View style={{ paddingHorizontal: 20, gap: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <T mono size={12} weight="700" ls={1}>{`STEP ${n + 1} OF ${STEPS.length}`}</T>
                <Pressable accessibilityRole="button" onPress={finish} style={{ height: 34, paddingHorizontal: 14, borderRadius: 99, backgroundColor: 'rgba(21,19,15,0.12)', justifyContent: 'center' }}>
                  <T size={14} weight="600">{replay ? 'Close' : 'Skip'}</T>
                </Pressable>
              </View>
              <View accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: STEPS.length, now: n + 1 }} style={{ height: 6, borderRadius: 99, backgroundColor: 'rgba(21,19,15,0.15)', overflow: 'hidden' }}>
                <View style={{ width: `${((n + 1) / STEPS.length) * 100}%`, height: '100%', backgroundColor: night.ink, borderRadius: 99 }} />
              </View>
            </View>

            <View style={{ height: CH * scale, marginTop: 16, alignItems: 'center' }} importantForAccessibility="no-hide-descendants">
              <View style={{ width: CW, height: CH, transform: [{ scale }], transformOrigin: 'top' as any, marginTop: 0 }}>
                {Math.abs(n - i) <= 1 && <Art />}
              </View>
            </View>

            <View style={{ flex: 1, justifyContent: 'flex-end', paddingHorizontal: 24, gap: 10 }}>
              <T display size={48} lh={0.92}>{s.title}</T>
              <T size={15} lh={1.45}>{s.body}</T>
              {s.extra}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                {n > 0 && (
                  <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => goTo(n - 1)} style={{ width: 56, height: 56, borderRadius: 16, borderWidth: 2, borderColor: night.ink, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="arrow-back" size={20} color={night.ink} />
                  </Pressable>
                )}
                <Pressable accessibilityRole="button" onPress={() => (last ? finish() : goTo(n + 1))} style={{ flex: 1, height: 56, borderRadius: 16, backgroundColor: night.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 }}>
                  <T size={16} weight="600" color={night.paper}>{n === 0 ? 'Show me how' : last ? (replay ? 'Done' : 'Find my first event') : 'Next'}</T>
                  <Ionicons name="arrow-forward" size={20} color={s.arrow ?? night.orange} />
                </Pressable>
              </View>
              {n === 0 && !replay && <Pressable onPress={finish} style={{ alignSelf: 'center', paddingTop: 4 }}><T size={14} weight="600" style={{ textDecorationLine: 'underline' }}>Skip for now</T></Pressable>}
              {last && !replay && <T size={13} weight="600" center style={{ textDecorationLine: 'underline' }}>Replay this guide anytime in Help</T>}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}
