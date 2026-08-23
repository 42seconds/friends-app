import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useUserRole } from '../../src/hooks/useUserRole';
import { getTicketById, checkInTicket } from '../../src/services/ticketService';

export default function ScanScreen() {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [permission, requestPermission] = useCameraPermissions();

  // scannedTicket holds the looked-up ticket after a successful scan.
  // scanning=false pauses the camera's callback so one QR code doesn't
  // fire handleBarcodeScanned repeatedly while it's in frame.
  const [scanning, setScanning] = useState(true);
  const [scannedTicket, setScannedTicket] = useState<any>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [justValidated, setJustValidated] = useState(false);

  // Second layer of the admin gate — even if someone reached this route
  // directly, non-admins see a blocked message instead of the scanner.
  if (roleLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#C1502E" />
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={styles.centered}>
        <Text style={styles.blockedText}>This screen is for admin accounts only.</Text>
      </View>
    );
  }

  if (!permission) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#C1502E" /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.blockedText}>Camera access is needed to scan tickets.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // The QR code just encodes the raw ticket ID string (see QRCodeCard,
  // which encodes ticket.id directly — no JSON wrapping), so the scanned
  // value IS the document ID we look up.
  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    setScanning(false);
    setLookupError(null);
    const ticket = await getTicketById(data);
    if (!ticket) {
      setLookupError(`No ticket found for ID: ${data}`);
      return;
    }
    setScannedTicket(ticket);
  };

 const handleCheckIn = async () => {
  if (!scannedTicket) return;
  setValidating(true);
  try {
    await checkInTicket(scannedTicket.id);
    setJustValidated(true);
  } catch (err) {
    setLookupError('Check-in failed. Try again.');
  } finally {
    setValidating(false);
  }
};

  // Resets everything to scan the next ticket.
  const handleScanNext = () => {
    setScannedTicket(null);
    setLookupError(null);
    setJustValidated(false);
    setScanning(true);
  };

  // While actively scanning, show the camera full-screen.
  if (scanning) {
    return (
      <View style={styles.container}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={handleBarcodeScanned}
        />
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>Scan a ticket QR code</Text>
        </View>
      </View>
    );
  }

  // Not scanning — show either the lookup error or the ticket result.
  return (
    <View style={styles.resultContainer}>
      {lookupError && (
        <>
          <Text style={styles.errorText}>{lookupError}</Text>
          <TouchableOpacity style={styles.button} onPress={handleScanNext}>
            <Text style={styles.buttonText}>Scan Again</Text>
          </TouchableOpacity>
        </>
      )}

      {scannedTicket && !lookupError && (
        <View style={styles.card}>
          <Text style={styles.ticketId}>{scannedTicket.id}</Text>
          <Text style={styles.holder}>{scannedTicket.userName ?? 'Unknown'}</Text>
          <Text style={styles.detail}>{scannedTicket.eventTitle ?? 'Unknown event'}</Text>
          <Text style={styles.detail}>{scannedTicket.tier} · Qty {scannedTicket.quantity}</Text>


{scannedTicket.status !== 'confirmed' ? (
  <Text style={styles.errorText}>
    ⚠ Payment not yet confirmed — cannot check in
  </Text>
) : scannedTicket.checkedIn || justValidated ? (
  <Text style={styles.alreadyValid}>
    {justValidated ? '✓ Checked in just now' : '✓ Already checked in'}
  </Text>
) : (
  <TouchableOpacity
    style={styles.button}
    onPress={handleCheckIn}
    disabled={validating}
  >
    {validating ? (
      <ActivityIndicator color="#fff" />
    ) : (
      <Text style={styles.buttonText}>Check In</Text>
    )}
  </TouchableOpacity>
)}








          <TouchableOpacity style={styles.scanNextButton} onPress={handleScanNext}>
            <Text style={styles.scanNextText}>Scan Next Ticket</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 24 },
  overlay: { position: 'absolute', bottom: 60, alignSelf: 'center' },
  overlayText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  resultContainer: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#FFFFFF' },
  card: { alignItems: 'center' },
  ticketId: { fontSize: 14, color: '#888', fontFamily: 'monospace', marginBottom: 8 },
  holder: { fontSize: 24, fontWeight: 'bold', color: '#000000', marginBottom: 4 },
  detail: { fontSize: 16, color: '#555555', marginBottom: 4 },
  alreadyValid: { fontSize: 16, color: '#4E7C4B', fontWeight: '600', marginTop: 16 },
  errorText: { fontSize: 16, color: '#B23A2E', textAlign: 'center', marginBottom: 16 },
  blockedText: { fontSize: 16, color: '#555555', textAlign: 'center', marginBottom: 16 },
  button: {
    backgroundColor: '#C1502E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  scanNextButton: { marginTop: 16 },
  scanNextText: { color: '#C1502E', fontWeight: '600' },
});