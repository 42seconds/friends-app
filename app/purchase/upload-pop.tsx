import { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { uploadProofOfPayment } from '../../src/services/paymentService';

export default function UploadProofScreen() {
  // ticketId came from checkout.tsx's router.push after createTicket() succeeded.
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
  const router = useRouter();

  // Holds the LOCAL device URI of the picked image, before upload.
  // Used to show a preview to the user so they can confirm it's the
  // right screenshot before submitting.
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    // Ask for permission to access the photo library. If denied,
    // launchImageLibraryAsync would just silently fail — better to
    // check explicitly and tell the user why nothing happened.
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to upload proof of payment.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7, // compressed slightly — full-res screenshots are unnecessarily large for a POP image
    });

    // result.canceled is true if the user backed out of the picker
    // without selecting anything.
    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!imageUri || !ticketId) return;

    setUploading(true);
    try {
      await uploadProofOfPayment(ticketId, imageUri);
      // Move to the "awaiting verification" screen once upload +
      // Firestore update both succeed.
      router.push(`/purchase/awaiting?ticketId=${ticketId}`);
    } catch (error) {
      console.error('Upload failed:', error);
      Alert.alert('Upload failed', 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Upload Proof of Payment</Text>

      {/* Placeholder bank details — replace with your real business
          banking info before the actual demo. */}
      <View style={styles.bankBox}>
        <Text style={styles.bankLabel}>Bank Transfer Details</Text>
        <Text style={styles.bankText}>Account Name: &FRIENDS</Text>
        <Text style={styles.bankText}>Bank: FNB</Text>
        <Text style={styles.bankText}>Account No: 0000000000</Text>
        <Text style={styles.bankText}>Reference: {ticketId}</Text>
      </View>

      <TouchableOpacity style={styles.pickButton} onPress={pickImage}>
        <Text style={styles.pickButtonText}>
          {imageUri ? 'Change Image' : 'Select Proof of Payment'}
        </Text>
      </TouchableOpacity>

      {/* Preview — only shows once an image has actually been picked. */}
      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.preview} />
      )}

      <TouchableOpacity
        style={[styles.submitButton, !imageUri && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={!imageUri || uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Submit</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', padding: 20 },
  header: { fontSize: 22, fontWeight: 'bold', color: '#000000', marginBottom: 20 },
  bankBox: {
    backgroundColor: '#F4EBE1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  bankLabel: { fontSize: 14, fontWeight: '700', color: '#000000', marginBottom: 8 },
  bankText: { fontSize: 14, color: '#3B2A22', marginBottom: 2 },
  pickButton: {
    borderWidth: 1,
    borderColor: '#C1502E',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  pickButtonText: { color: '#C1502E', fontWeight: '600' },
  preview: { width: '100%', height: 200, borderRadius: 8, marginBottom: 20, backgroundColor: '#eee' },
  submitButton: {
    backgroundColor: '#C1502E',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: { backgroundColor: '#e0b3a3' },
  submitButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});