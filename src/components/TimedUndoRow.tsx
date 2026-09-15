import { useEffect, useRef, useState } from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';

interface TimedUndoRowProps {
  label: string;
  countingLabel: (secondsLeft: number) => string;
  seconds?: number;
  onConfirm: () => void;
}

// Tap "Sign Out" -> row switches into a countdown with a Cancel button.
// If not cancelled before it hits 0, onConfirm() fires automatically.
// Same idea as the delete-with-undo pattern you picked, just aimed at
// sign-out instead of account deletion.
export default function TimedUndoRow({ label, countingLabel, seconds = 5, onConfirm }: TimedUndoRowProps) {
  const [counting, setCounting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(seconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const start = () => {
    setCounting(true);
    setSecondsLeft(seconds);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          onConfirm();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancel = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setCounting(false);
  };

  if (counting) {
    return (
      <View style={styles.countingRow}>
        <Text style={styles.countingText}>{countingLabel(secondsLeft)}</Text>
        <TouchableOpacity onPress={cancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.row} onPress={start}>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 16, paddingHorizontal: 16 },
  label: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: '#D64545' },
  countingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 16,
  },
  countingText: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: '#D64545' },
  cancelText: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: '#1A1A1A' },
});