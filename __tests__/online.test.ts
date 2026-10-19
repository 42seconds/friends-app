import NetInfo from '@react-native-community/netinfo';
import { requireOnline, withTimeout, isOfflineError, OfflineError } from '../src/lib/online';

describe('online checks', () => {
  it('stops buying or logging in straight away when offline', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({ isConnected: false, isInternetReachable: false });
    await expect(requireOnline()).rejects.toBeInstanceOf(OfflineError);
  });

  it('lets the action go ahead when online', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({ isConnected: true, isInternetReachable: true });
    await expect(requireOnline()).resolves.toBeUndefined();
  });

  it('gives up on a request that never answers', async () => {
    const e = await withTimeout(new Promise(() => {}), 10).catch((x) => x);
    expect(isOfflineError(e)).toBe(true);
    expect((e as OfflineError).code).toContain('network'); // shown as "You're offline"
  });

  it('passes results and other errors through', async () => {
    await expect(withTimeout(Promise.resolve(5), 1000)).resolves.toBe(5);
    await expect(withTimeout(Promise.reject(new Error('denied')), 1000)).rejects.toThrow('denied');
  });
});
