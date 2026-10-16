jest.mock('../src/firebase/firebaseConfig', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({}));
import { buildPushRequest } from '../src/lib/push';

describe('push messages', () => {
  it('sends one message per valid Expo token', () => {
    const m = buildPushRequest(['ExponentPushToken[abc]', 'ExpoPushToken[def]', 'not-a-token'], { title: 'T', body: 'B', url: '/ticket/1' });
    expect(m).toHaveLength(2);
    expect(m[0]).toMatchObject({ to: 'ExponentPushToken[abc]', title: 'T', body: 'B', channelId: 'tickets', data: { url: '/ticket/1' } });
  });

  it('sends nothing without tokens', () => {
    expect(buildPushRequest([], { title: 'T', body: 'B' })).toEqual([]);
  });
});
