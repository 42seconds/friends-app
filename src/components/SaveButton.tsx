import { useEffect, useRef, useState } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type SaveState = 'idle' | 'loading' | 'success';

interface SaveButtonProps {
  onSave: () => Promise<void>;
}

// Mirrors the idle/loading/success button pattern you picked out —
// rebuilt with RN's own Animated API instead of Framer Motion, which
// doesn't exist on this platform.
export default function SaveButton({ onSave }: SaveButtonProps) {
  const [state, setState] = useState<SaveState>('idle');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const crossfadeTo = (next: SaveState) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    setState(next);
  };

  const handlePress = async () => {
    if (state !== 'idle') return;
    crossfadeTo('loading');
    await onSave();
    crossfadeTo('success');
    setTimeout(() => crossfadeTo('idle'), 1500);
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handlePress} disabled={state !== 'idle'}>
      <Animated.View style={[styles.row, { opacity: fadeAnim }]}>
        {state === 'idle' && <Text style={styles.text}>Save</Text>}
        {state === 'loading' && (
          <>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.text}>Saving...</Text>
          </>
        )}
        {state === 'success' && (
          <>
            <Ionicons name="checkmark" size={16} color="#fff" />
            <Text style={styles.text}>Saved</Text>
          </>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { backgroundColor: '#1A1A1A', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: '#fff' },
});