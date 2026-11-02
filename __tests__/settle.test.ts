import { settleWithin } from '../src/lib/settle';

describe('settleWithin', () => {
  it('passes the value through when it arrives in time', async () => {
    await expect(settleWithin(Promise.resolve('ok'), 100, 'fallback')).resolves.toBe('ok');
  });
  it('uses the fallback when the promise fails', async () => {
    await expect(settleWithin(Promise.reject(new Error('broken')), 100, 'fallback')).resolves.toBe('fallback');
  });
  it('uses the fallback when the promise never answers', async () => {
    await expect(settleWithin(new Promise<string>(() => {}), 10, 'fallback')).resolves.toBe('fallback');
  });
});
