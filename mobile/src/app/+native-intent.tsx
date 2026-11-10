import { isStripeCardReturnUrl } from '@/features/booking/stripe/returnUrl';

export function redirectSystemPath({ path, initial }: { path: string; initial: boolean }) {
  if (!isStripeCardReturnUrl(path)) return path;
  // Stripe's listener handles an active challenge. A cold start can resume the saved draft.
  return initial ? '/booking' : null;
}
