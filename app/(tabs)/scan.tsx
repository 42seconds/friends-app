import { Redirect } from 'expo-router';

// Door scanning now lives in Staff mode.
export default function ScanRedirect() {
  return <Redirect href="/staff/scanner" />;
}
