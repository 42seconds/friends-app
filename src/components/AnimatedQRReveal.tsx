import { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';

interface AnimatedQRRevealProps {
  ticketId: string;
}

// Reimplements the collapsed-pill-to-expanded-card interaction using
// Animated (built into React Native), not Framer Motion — that library
// only exists for web. Same interaction, correct platform.
export default function AnimatedQRReveal({ ticketId }: AnimatedQRRevealProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const heightAnim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    Animated.spring(heightAnim, {
      toValue: next ? 1 : 0,
      useNativeDriver: false, // height can't use the native driver
      bounciness: 6,
    }).start();
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(ticketId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const animatedHeight = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 320],
  });

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity style={styles.collapsedButton} onPress={toggle} activeOpacity={0.85}>
        <Ionicons name="qr-code-outline" size={20} color="#fff" />
        <Text style={styles.collapsedText}>{expanded ? 'Hide QR Code' : 'Show QR Code'}</Text>
      </TouchableOpacity>

      <Animated.View style={[styles.expandedBox, { height: animatedHeight }]}>
        {expanded && (
          <View style={styles.expandedContent}>
            <View style={styles.qrCard}>
              <QRCode value={ticketId} size={180} />
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionButton} onPress={handleCopy}>
                <Ionicons name="copy-outline" size={16} color="#1A1A1A" />
                <Text style={styles.actionText}>{copied ? 'Copied' : 'Copy ID'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton} onPress={toggle}>
                <Ionicons name="close" size={18} color="#1A1A1A" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', width: '100%' },
  collapsedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  collapsedText: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: '#fff' },
  expandedBox: { width: '100%', overflow: 'hidden' },
  expandedContent: { alignItems: 'center', paddingTop: 16 },
  qrCard: {
    width: 220,
    height: 220,
    backgroundColor: '#fff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12, width: '100%', justifyContent: 'center' },
  actionButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
  },
  actionText: { fontFamily: 'Inter-SemiBold', fontSize: 13, color: '#1A1A1A' },
  closeButton: { backgroundColor: '#fff', borderRadius: 20, padding: 10 },
});