import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T, H1, Amp, TopBar, Field, PrimaryButton, TextLink, Screen, Hero, SectionLabel } from '../../src/components/night';
import { registerUser, authErrorMessage } from '../../src/services/authService';
import { SUB_BRANDS } from '../../src/lib/subbrands';
import { night } from '../../src/theme/night';

// 0-4 bars: length, mixed case, digit, symbol.
function strength(pw: string) {
  if (!pw) return 0;
  let s = pw.length >= 8 ? 1 : 0;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

export default function RegisterScreen() {
  const router = useRouter();
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggle = (k: string) => setInterests((xs) => (xs.includes(k) ? xs.filter((x) => x !== k) : [...xs, k]));
  const bars = strength(password);

  const handleRegister = async () => {
    const e: Record<string, string> = {};
    if (!first.trim()) e.first = 'Add your first name';
    if (!/\S+@\S+\.\S+/.test(email.trim())) e.email = "That email doesn't look right";
    if (password.length < 8) e.password = 'Use at least 8 characters';
    if (!agreed) e.terms = 'Please accept the Terms and Privacy Policy';
    setErrors(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    try {
      const digits = phone.replace(/\D/g, '').replace(/^0/, '');
      await registerUser({
        name: [first.trim(), last.trim()].filter(Boolean).join(' '),
        email: email.trim(),
        phone: digits ? `+27 ${digits}` : '',
        password,
        interests,
      });
      router.replace('/notifications-optin');
    } catch (err) {
      setErrors({ form: authErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen header={<TopBar dark onBack={() => (router.canGoBack() ? router.back() : router.replace('/(auth)/login'))} />} headerBg={night.ink}
      padTop={false}
      hero={
        <Hero bg={night.ink} gap={14}>
          <Amp size={220} color={night.lime} style={{ right: -20, top: 40 }} />
          <View style={{ marginTop: 28 }}>
            <H1 size={66} color={night.paper}>Join{'\n'}&amp;Friends</H1>
          </View>
          <T size={15} color={night.inkMuted}>Takes about a minute.</T>
        </Hero>
      }
      contentStyle={{ gap: 14 }}
    >
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Field label="FIRST NAME" value={first} onChangeText={setFirst} autoCapitalize="words" error={errors.first} />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="LAST NAME" value={last} onChangeText={setLast} autoCapitalize="words" />
        </View>
      </View>
      <Field label="EMAIL" value={email} onChangeText={setEmail} placeholder="hello@example.com" keyboardType="email-address" autoCapitalize="none" error={errors.email} />
      <Field
        label="PHONE"
        value={phone}
        onChangeText={setPhone}
        placeholder="82 000 0000"
        keyboardType="phone-pad"
        left={
          <View style={{ marginLeft: -6, paddingHorizontal: 10, height: 36, borderRadius: 10, backgroundColor: night.sand, justifyContent: 'center' }}>
            <T mono size={15}>+27</T>
          </View>
        }
        hint="For ticket updates on WhatsApp, if you turn them on"
      />
      <View style={{ gap: 8 }}>
        <Field label="PASSWORD" value={password} onChangeText={setPassword} placeholder="8+ characters" secure autoCapitalize="none" error={errors.password} />
        <View style={{ flexDirection: 'row', gap: 4 }} accessibilityLabel={`Password strength ${bars} of 4`}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={{ flex: 1, height: 4, borderRadius: 9, backgroundColor: i < bars ? (bars < 2 ? night.orange : bars < 4 ? night.yellow : night.success) : night.border }} />
          ))}
        </View>
      </View>

      <View style={{ gap: 10, marginTop: 4 }}>
        <SectionLabel>WHAT ARE YOU INTO?</SectionLabel>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {SUB_BRANDS.map((b) => {
            const on = interests.includes(b.key);
            return (
              <Pressable
                key={b.key}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                onPress={() => toggle(b.key)}
                style={{ width: '48.5%', height: 52, borderRadius: 14, borderWidth: on ? 2 : 1.5, borderColor: on ? night.ink : night.border, backgroundColor: on ? b.color : night.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {!on && <View style={{ width: 10, height: 10, borderRadius: 99, backgroundColor: b.color }} />}
                  <T display size={22}>{b.name}</T>
                </View>
                {on && <Ionicons name="checkmark" size={18} color={night.ink} />}
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: agreed }} onPress={() => setAgreed((a) => !a)} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 4 }}>
        <View style={{ width: 24, height: 24, borderRadius: 7, backgroundColor: agreed ? night.ink : night.card, borderWidth: agreed ? 0 : 1.5, borderColor: night.border, alignItems: 'center', justifyContent: 'center' }}>
          {agreed && <Ionicons name="checkmark" size={16} color={night.lime} />}
        </View>
        <T size={14} style={{ flex: 1 }}>
          I agree to the{' '}
          <T size={14} weight="700" style={{ textDecorationLine: 'underline' }} onPress={() => router.push('/settings/legal?tab=terms')}>Terms</T> and{' '}
          <T size={14} weight="700" style={{ textDecorationLine: 'underline' }} onPress={() => router.push('/settings/legal')}>Privacy Policy</T>.
        </T>
      </Pressable>
      {!!errors.terms && <T size={13} weight="600" color={night.danger}>{errors.terms}</T>}
      {!!errors.form && <T size={14} weight="600" color={night.danger}>{errors.form}</T>}

      <PrimaryButton label="Create my account" onPress={handleRegister} loading={loading} />
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
        <T size={15} color={night.muted}>Already a member?</T>
        <TextLink label="Log in" size={15} onPress={() => router.replace('/(auth)/login')} />
      </View>
    </Screen>
  );
}
