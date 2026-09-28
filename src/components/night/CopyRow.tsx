import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import T from './T';
import { night } from '../../theme/night';

// "Account number · 0000000000 [copy]" — tap anywhere on the row to copy.
export default function CopyRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await Clipboard.setStringAsync(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Copy ${label}`} onPress={copy} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}>
      <View style={{ flex: 1, gap: 2 }}>
        <T size={12} color={night.muted}>{label}</T>
        <T mono={!strong} display={strong} size={strong ? 30 : 15} weight="700">{value}</T>
      </View>
      <View style={{ height: 36, paddingHorizontal: copied ? 12 : 0, width: copied ? undefined : 36, borderRadius: 10, backgroundColor: copied ? night.ink : night.paper, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={16} color={copied ? night.lime : night.ink} />
        {copied && <T size={12} weight="700" color={night.paper}>Copied</T>}
      </View>
    </Pressable>
  );
}
