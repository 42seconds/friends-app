import { ComponentRef, useRef, useState } from 'react';
import { Platform, Pressable, TextInput, View } from 'react-native';
import T from './T';
import { night } from '../../theme/night';

const LENGTH = 6;

// Six boxes for a one-time code. One hidden text field underneath takes
// the typing (and pasting, and the phone's "code from Mail" suggestion);
// the boxes just show it.
export default function CodeInput({ value, onChange, onComplete, error, autoFocus = true, disabled }: { value: string; onChange: (v: string) => void; onComplete?: (v: string) => void; error?: boolean; autoFocus?: boolean; disabled?: boolean }) {
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const [focused, setFocused] = useState(false);

  const change = (raw: string) => {
    const v = raw.replace(/\D/g, '').slice(0, LENGTH);
    onChange(v);
    if (v.length === LENGTH) onComplete?.(v);
  };

  return (
    <Pressable accessibilityRole="none" onPress={() => input.current?.focus()} style={{ position: 'relative' }}>
      <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'space-between' }} pointerEvents="none">
        {Array.from({ length: LENGTH }, (_, i) => {
          const ch = value[i] ?? '';
          const active = focused && (i === value.length || (i === LENGTH - 1 && value.length === LENGTH));
          return (
            <View
              key={i}
              style={{
                flex: 1,
                maxWidth: 52,
                height: 60,
                borderRadius: 14,
                borderWidth: active ? 2 : 1.5,
                borderColor: error ? night.danger : active ? night.ink : night.border,
                backgroundColor: night.card,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: i === 2 ? 8 : 0,
              }}
            >
              <T mono weight="700" size={26}>{ch}</T>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={input}
        value={value}
        onChangeText={change}
        editable={!disabled}
        autoFocus={autoFocus}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
        maxLength={LENGTH}
        accessibilityLabel="6-digit code"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        caretHidden
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.011, color: 'transparent', fontSize: 16 }}
      />
    </Pressable>
  );
}
