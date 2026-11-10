import { redirectSystemPath } from '@/app/+native-intent';

describe('Stripe card authentication return links', () => {
  it('leaves the active card screen in place for the Stripe SDK to handle the callback', () => {
    expect(redirectSystemPath({ path: 'runout://safepay?payment_intent=pi_test', initial: false })).toBeNull();
  });

  it('opens the saved booking on a cold return', () => {
    expect(redirectSystemPath({ path: 'runout://safepay', initial: true })).toBe('/booking');
  });

  it('preserves unrelated Run Out links', () => {
    expect(redirectSystemPath({ path: 'runout://oauth/callback', initial: false })).toBe('runout://oauth/callback');
  });
});
