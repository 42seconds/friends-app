import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

// False when the phone has no connection (or no internet behind it).
export function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => NetInfo.addEventListener((s) => setOnline(s.isConnected !== false && s.isInternetReachable !== false)), []);
  return online;
}
