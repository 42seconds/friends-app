import * as ImagePicker from 'expo-image-picker';

export type ProofSource = 'camera' | 'photos';

// Returns a local image uri, 'denied' when the permission was refused,
// or null when the user backed out.
export async function pickProof(source: ProofSource): Promise<string | 'denied' | null> {
  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return 'denied';
    const res = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    return res.canceled ? null : res.assets[0]?.uri ?? null;
  }
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return 'denied';
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
  return res.canceled ? null : res.assets[0]?.uri ?? null;
}
