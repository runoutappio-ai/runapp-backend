import { lazy } from 'react';
import { Platform, TurboModuleRegistry } from 'react-native';
import { config } from '@/config';
import type { CheckoutStrategy } from '../checkoutStrategy';

const NativePaymentButtons = lazy(() => import('./NativePaymentButtons'));

export const stripeCheckoutStrategy: CheckoutStrategy = {
  provider: 'stripe',
  label: 'Stripe',
  hostedOrigin: 'https://checkout.stripe.com',
  hostedDescription: 'Stripe test checkout · pay by card or with Apple Pay or Google Pay when available.',
  nativeDescription: 'Secure Stripe test payment.',
  nativeButtons: () => Platform.OS === 'ios' && config.stripePublishableKey.startsWith('pk_test_')
    && TurboModuleRegistry.get('StripeSdk') != null ? NativePaymentButtons : undefined,
};
