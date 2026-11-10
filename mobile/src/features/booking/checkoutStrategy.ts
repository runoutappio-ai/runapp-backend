import type { ComponentType } from 'react';
import { config } from '@/config';
import { openHostedCheckout, openNativeCheckout, type NativeCheckout } from '@/features/reservations/api';
import { stripeCheckoutStrategy } from './stripe/strategy';

export type NativePaymentLauncher = (payment: NativeCheckout) => Promise<boolean>;

export type NativePaymentButtonsProps = {
  onPay: (launch: NativePaymentLauncher) => Promise<void>;
  disabled: boolean;
  busy: boolean;
  feeInFils: number;
  error: string;
};

export type CheckoutStrategy = {
  provider: string;
  label: string;
  hostedOrigin: string;
  hostedDescription: string;
  nativeDescription?: string;
  nativeButtons?: () => ComponentType<NativePaymentButtonsProps> | undefined;
};

const strategies = new Map<string, CheckoutStrategy>([[stripeCheckoutStrategy.provider, stripeCheckoutStrategy]]);
export const checkoutStrategy = strategies.get(config.paymentProvider);

export async function startHostedCheckout(strategy: CheckoutStrategy, reservationId: string) {
  const checkout = await openHostedCheckout(reservationId);
  if (checkout.provider !== strategy.provider || new URL(checkout.url).origin !== strategy.hostedOrigin) {
    throw new Error('Unexpected checkout provider or address.');
  }
  return checkout.url;
}

export async function startNativeCheckout(strategy: CheckoutStrategy, reservationId: string) {
  const checkout = await openNativeCheckout(reservationId);
  if (checkout.provider !== strategy.provider) throw new Error('Unexpected checkout provider.');
  return checkout;
}
