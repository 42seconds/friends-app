import { useEffect, useState } from 'react';
import { Alert, Pressable, Share, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { T, H1, H2, Screen, TopBar, StaffGate, StaffPill, Segmented, Chip, ChipRow, Field, PrimaryButton, SectionLabel, Toggle } from '../../src/components/night';
import { useAuth } from '../../src/context/AuthContext';
import { useEvents } from '../../src/hooks/useEvents';
import { createAccessCode, listenToAccessCodes, setAccessCodeActive } from '../../src/services/communityService';
import { AccessCode, CodeType, describeCode, generateCode, codeProblem } from '../../src/lib/accessCodes';
import { requireOnline, withTimeout, isOfflineError } from '../../src/lib/online';
import { night } from '../../src/theme/night';

const PERCENTS = [10, 20, 30, 50];
const USES: { label: string; value?: number }[] = [{ label: '1 booking', value: 1 }, { label: '10', value: 10 }, { label: '50', value: 50 }, { label: 'No limit' }];
const EXPIRY: { label: string; days?: number }[] = [{ label: 'Never' }, { label: '7 days', days: 7 }, { label: '30 days', days: 30 }];

function shareText(c: Pick<AccessCode, 'code' | 'type' | 'percentOff'>, eventTitle?: string) {
  const what = c.type === 'comp' ? 'free tickets' : `${c.percentOff}% off`;
  return `Your &FRIENDS code: ${c.code} (${what}${eventTitle ? ` for ${eventTitle}` : ''}). Open the event in the &friends app, choose your tickets, then tap "Add promo or access code" on the Review booking screen.`;
}

// Staff: make discount and guest-list (comp) codes, share them, switch
// them off. Guests enter them on the Review booking screen.
export default function AccessCodesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { upcoming } = useEvents();
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [type, setType] = useState<CodeType>('percent');
  const [percent, setPercent] = useState(20);
  const [eventId, setEventId] = useState<string | null>(null);
  const [uses, setUses] = useState<number | undefined>(10);
  const [days, setDays] = useState<number | undefined>(undefined);
  const [label, setLabel] = useState('');
  const [custom, setCustom] = useState('');
  const [saving, setSaving] = useState(false);
  const [made, setMade] = useState<AccessCode | null>(null);

  useEffect(() => listenToAccessCodes(setCodes), []);

  const eventTitle = (id?: string) => upcoming.find((e) => e.id === id)?.title;

  const create = async () => {
    if (!user) return;
    const code = (custom.trim() || generateCode(type, percent)).toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (!code) return;
    setSaving(true);
    try {
      await requireOnline();
      const expiresAt = days ? new Date(Date.now() + days * 86400000).toISOString() : undefined;
      await withTimeout(createAccessCode({ code, type, percentOff: percent, label: label.trim() || undefined, eventId: eventId ?? undefined, maxUses: uses, expiresAt, createdBy: user.uid }));
      setMade({ code, type, percentOff: type === 'comp' ? 100 : percent, label: label.trim() || undefined, eventId: eventId ?? undefined, maxUses: uses, uses: 0, expiresAt, active: true });
      setCustom('');
      setLabel('');
    } catch (e: any) {
      Alert.alert("Couldn't make the code", isOfflineError(e) ? 'Making codes needs an internet connection.' : e?.message ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <StaffGate>
      <Screen header={<TopBar dark onBack={() => router.replace('/staff')} center={<StaffPill />} />} bg={night.ink} dark
        footerDark
        footer={<PrimaryButton tone="orange" icon="sparkles-outline" arrow={false} center label={type === 'comp' ? 'Make guest-list code' : `Make ${percent}% off code`} loading={saving} onPress={create} />}
      >
        <H1 size={56} color={night.paper}>Access codes</H1>
        <T size={14} lh={1.5} color={night.inkMuted}>Guests enter a code on the Review booking screen. Discount codes lower the price. Guest-list codes make the tickets free, with the QR ready straight away.</T>

        {made && (
          <View style={{ padding: 16, borderRadius: 20, backgroundColor: night.lime, gap: 10 }}>
            <T mono weight="700" size={11}>NEW CODE · {describeCode(made).toUpperCase()}</T>
            <T display size={44}>{made.code}</T>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable accessibilityRole="button" onPress={() => Clipboard.setStringAsync(made.code)} style={{ flex: 1, height: 44, borderRadius: 12, backgroundColor: night.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Ionicons name="copy-outline" size={16} color={night.paper} />
                <T size={14} weight="600" color={night.paper}>Copy</T>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => Share.share({ message: shareText(made, eventTitle(made.eventId)) })} style={{ flex: 1, height: 44, borderRadius: 12, backgroundColor: night.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Ionicons name="share-social-outline" size={16} color={night.paper} />
                <T size={14} weight="600" color={night.paper}>Share</T>
              </Pressable>
            </View>
          </View>
        )}

        <SectionLabel dark>MAKE A CODE</SectionLabel>
        <Segmented dark value={type} onChange={setType} options={[{ key: 'percent', label: 'Discount' }, { key: 'comp', label: 'Guest list (free)' }]} />

        {type === 'percent' && (
          <View style={{ gap: 8 }}>
            <T size={13} weight="600" color={night.inkMuted}>Discount</T>
            <ChipRow>{PERCENTS.map((p) => <Chip key={p} dark label={`${p}% off`} active={percent === p} onPress={() => setPercent(p)} />)}</ChipRow>
          </View>
        )}

        <View style={{ gap: 8 }}>
          <T size={13} weight="600" color={night.inkMuted}>Event</T>
          <ChipRow>
            <Chip dark label="Any event" active={!eventId} onPress={() => setEventId(null)} />
            {upcoming.slice(0, 8).map((e) => <Chip key={e.id} dark label={e.title} active={eventId === e.id} onPress={() => setEventId(e.id)} />)}
          </ChipRow>
        </View>

        <View style={{ gap: 8 }}>
          <T size={13} weight="600" color={night.inkMuted}>Can be used for</T>
          <ChipRow>{USES.map((u) => <Chip key={u.label} dark label={u.label} active={uses === u.value} onPress={() => setUses(u.value)} />)}</ChipRow>
        </View>

        <View style={{ gap: 8 }}>
          <T size={13} weight="600" color={night.inkMuted}>Expires</T>
          <ChipRow>{EXPIRY.map((x) => <Chip key={x.label} dark label={x.label} active={days === x.days} onPress={() => setDays(x.days)} />)}</ChipRow>
        </View>

        <Field dark label="WHO IS IT FOR? (OPTIONAL)" value={label} onChangeText={setLabel} placeholder="e.g. Wits students, DJ's guests, Press" maxLength={40} />
        <Field dark mono label="OWN CODE (OPTIONAL)" value={custom} onChangeText={(v) => setCustom(v.toUpperCase())} placeholder="Leave empty to generate one" autoCapitalize="characters" maxLength={30} hint="Letters, numbers, - and _ only." />

        <View style={{ marginTop: 10 }}><H2 size={32} color={night.paper}>All codes</H2></View>
        {codes.length === 0 && <T size={14} color={night.inkMuted}>No codes yet.</T>}
        {codes.map((c) => {
          const problem = c.active ? codeProblem(c, c.eventId ?? '') : null;
          return (
            <View key={c.code} style={{ padding: 14, borderRadius: 18, backgroundColor: night.ink2, gap: 6, opacity: c.active ? 1 : 0.6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <T mono weight="700" size={16} color={night.paper}>{c.code}</T>
                  <T size={13} color={night.inkMuted}>{[describeCode(c), c.label].filter(Boolean).join(' · ')}</T>
                </View>
                <Toggle value={c.active} label={`${c.code} on or off`} onChange={(v) => setAccessCodeActive(c.code, v).catch(() => Alert.alert("Couldn't change the code", 'Check your connection and try again.'))} />
              </View>
              <T size={12} color={night.inkMuted}>
                {[
                  `Used ${c.uses}${c.maxUses ? ` of ${c.maxUses}` : ''}`,
                  c.eventId ? eventTitle(c.eventId) ?? 'One event' : 'Any event',
                  c.expiresAt ? `Expires ${new Date(c.expiresAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}` : null,
                  problem,
                ].filter(Boolean).join(' · ')}
              </T>
              <Pressable accessibilityRole="button" onPress={() => Share.share({ message: shareText(c, eventTitle(c.eventId)) })} style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="share-social-outline" size={14} color={night.orange} />
                <T size={13} weight="600" color={night.orange}>Share</T>
              </Pressable>
            </View>
          );
        })}
      </Screen>
    </StaffGate>
  );
}
