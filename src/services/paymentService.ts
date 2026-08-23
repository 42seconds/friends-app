import * as ImageManipulator from 'expo-image-manipulator';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

// Converts a Blob into a base64 data URI string using FileReader.
// This avoids expo-file-system entirely, sidestepping the EncodingType
// API mismatch on the currently installed version.
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string); // already a full "data:image/jpeg;base64,..." string
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Stores the proof-of-payment image as a compressed base64 string
// directly on the ticket document, instead of Firebase Storage
// (which requires the paid Blaze plan). Firestore itself stays free.
export async function uploadProofOfPayment(ticketId: string, imageUri: string) {
  // Step 1: resize + compress aggressively.
  // 800px wide keeps enough detail to read amounts/references on a
  // bank screenshot, while keeping the final size well under Firestore's
  // 1MB per-document limit.
  const manipulated = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 800 } }],
    { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
  );

  // Step 2: fetch the compressed local file and convert to a Blob.
  const response = await fetch(manipulated.uri);
  const blob = await response.blob();

  // Step 3: convert that Blob into a base64 data URI string.
  const base64DataUri = await blobToBase64(blob);

  // Rough safety check — base64 encoding inflates size by ~33%, and we
  // want headroom for the ticket doc's other fields too. Better to fail
  // clearly here than let Firestore reject the write with a cryptic error.
  const approxSizeKB = (base64DataUri.length * 0.75) / 1024;
  if (approxSizeKB > 700) {
    throw new Error('Image still too large after compression. Try a smaller screenshot.');
  }

  const ticketRef = doc(db, 'tickets', ticketId);
  await updateDoc(ticketRef, {
    proofOfPayment: base64DataUri,
    status: 'pending_verification',
  });

  return base64DataUri;
}