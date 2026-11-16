import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import T from './T';
import { Field } from './Controls';
import { night } from '../../theme/night';
import { LIMITS, PASSWORD_RULES } from '../../lib/validation';

// The password rules written out under the box, each ticking green as it's
// met. After a failed "Create account", the unmet ones turn red.
export function PasswordRules({ value, showMissing }: { value: string; showMissing?: boolean }) {
  return (
    <View accessibilityLabel="Password rules" style={{ gap: 6, padding: 14, borderRadius: 14, backgroundColor: night.card, borderWidth: 1.5, borderColor: night.border }}>
      <T size={12} weight="600" ls={1} color={night.muted}>YOUR PASSWORD NEEDS</T>
      {PASSWORD_RULES.map((r) => {
        const ok = !!value && r.test(value);
        const color = ok ? night.success : showMissing ? night.danger : night.muted;
        return (
          <View key={r.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} accessibilityLabel={`${r.label}: ${ok ? 'done' : 'not yet'}`}>
            <Ionicons name={ok ? 'checkmark-circle' : showMissing ? 'close-circle' : 'ellipse-outline'} size={18} color={color} />
            <T size={14} color={ok ? night.ink : showMissing ? night.danger : night.body}>{r.label}</T>
          </View>
        );
      })}
    </View>
  );
}

// 0-4 bars: length, mixed case, digit, symbol.
function strength(pw: string) {
  if (!pw) return 0;
  let s = pw.length >= 8 ? 1 : 0;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9\s]/.test(pw)) s++;
  return s;
}

// "Choose a password" + the rules + "Confirm password", with a show/hide
// eye. Used on sign-up and when setting a new password.
export function NewPasswordFields({
  password,
  onPassword,
  confirm,
  onConfirm,
  errors = {},
  label = 'PASSWORD',
  onSubmit,
}: {
  password: string;
  onPassword: (v: string) => void;
  confirm: string;
  onConfirm: (v: string) => void;
  errors?: { password?: string; confirm?: string };
  label?: string;
  onSubmit?: () => void;
}) {
  const [show, setShow] = useState(false);
  const bars = strength(password);
  const matches = !!confirm && confirm === password;
  const eye = (
    <Pressable accessibilityLabel={show ? 'Hide password' : 'Show password'} onPress={() => setShow((s) => !s)} hitSlop={8}>
      <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={night.muted} />
    </Pressable>
  );
  return (
    <View style={{ gap: 10 }}>
      <Field label={label} value={password} onChangeText={onPassword} placeholder="Choose a password" secure={!show} autoCapitalize="none" maxLength={LIMITS.password} error={errors.password} right={eye} />
      <View style={{ flexDirection: 'row', gap: 4 }} accessibilityLabel={`Password strength ${bars} of 4`}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={{ flex: 1, height: 4, borderRadius: 9, backgroundColor: i < bars ? (bars < 2 ? night.orange : bars < 4 ? night.yellow : night.success) : night.border }} />
        ))}
      </View>
      <PasswordRules value={password} showMissing={!!errors.password} />
      <Field
        label="CONFIRM PASSWORD"
        value={confirm}
        onChangeText={onConfirm}
        placeholder="Type it again"
        secure={!show}
        autoCapitalize="none"
        maxLength={LIMITS.password}
        error={errors.confirm}
        onSubmitEditing={onSubmit}
        right={matches ? <Ionicons name="checkmark-circle" size={20} color={night.success} /> : eye}
        hint={matches ? 'Passwords match.' : undefined}
      />
    </View>
  );
}
