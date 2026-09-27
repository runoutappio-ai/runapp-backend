export type PaymentProvider = {
  name: string;
  isDemo: boolean;
  createPaymentMethodToken: (method?: 'card' | 'apple-pay' | 'google-pay') => Promise<string>;
};

export const mockPaymentProvider: PaymentProvider = {
  name: 'Demo payment',
  isDemo: true,
  async createPaymentMethodToken(method = 'card') {
    return `pm_mock_${method}_success`;
  },
};

export function requireCapturedPayment(status: string | null | undefined) {
  if (status !== 'CAPTURED') throw new Error(`Payment is ${status?.toLowerCase() ?? 'pending'}. Your restaurant remains sealed.`);
  return true;
}
