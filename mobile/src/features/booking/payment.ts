export type PaymentProvider = {
  name: string;
  isDemo: boolean;
  createPaymentMethodToken: (method?: 'card' | 'apple-pay' | 'google-pay') => Promise<string>;
};

export const RESERVATION_FEE_PERCENT = 10;

export function reservationFeeFor(tableBudget: number) {
  const budgetInFils = Math.round(tableBudget * 100);
  return Math.round(budgetInFils * RESERVATION_FEE_PERCENT / 100) / 100;
}

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
