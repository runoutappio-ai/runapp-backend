import { useEffect, useState } from 'react';
import { Linking, View } from 'react-native';
import {
  PlatformPay,
  PlatformPayButton,
  StripeProvider,
  usePlatformPay,
  useStripe,
} from '@stripe/stripe-react-native';
import { Button } from '@/components/ui';
import { config } from '@/config';
import { isStripeCardReturnUrl } from './returnUrl';
import { CardPaymentScreen } from './CardPaymentScreen.ios';
import type { NativePaymentButtonsProps } from '../checkoutStrategy';

function PaymentButtons({ onPay, disabled, busy, feeInFils, error }: NativePaymentButtonsProps) {
  const { confirmPayment, handleURLCallback } = useStripe();
  const { isPlatformPaySupported, confirmPlatformPayPayment } = usePlatformPay();
  const [applePayAvailable, setApplePayAvailable] = useState(false);
  const [cardFeeInFils, setCardFeeInFils] = useState<number | null>(null);

  useEffect(() => {
    if (!config.applePayMerchantId.startsWith('merchant.')) return;
    let active = true;
    void isPlatformPaySupported()
      .then((supported) => { if (active) setApplePayAvailable(supported); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [isPlatformPaySupported]);

  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (isStripeCardReturnUrl(url)) void handleURLCallback(url).catch(() => undefined);
    });
    return () => subscription.remove();
  }, [handleURLCallback]);

  const payByCard = () => onPay(async ({ credential, amountInMinorUnits }) => {
    if (amountInMinorUnits !== cardFeeInFils) {
      setCardFeeInFils(amountInMinorUnits);
      throw new Error('The reservation fee changed. Review the updated amount before paying.');
    }
    const result = await confirmPayment(credential, { paymentMethodType: 'Card' });
    if (result.error?.code === 'Canceled') return false;
    if (result.error) throw new Error(result.error.message);
    setCardFeeInFils(null);
    return true;
  });

  const payWithApple = () => onPay(async ({ credential, amountInMinorUnits }) => {
    const result = await confirmPlatformPayPayment(credential, {
      applePay: {
        merchantCountryCode: 'AE',
        currencyCode: 'AED',
        cartItems: [{
          label: 'Run Out',
          amount: (amountInMinorUnits / 100).toFixed(2),
          paymentType: PlatformPay.PaymentType.Immediate,
        }],
      },
    });
    if (result.error?.code === 'Canceled') return false;
    if (result.error) throw new Error(result.error.message);
    return true;
  });

  return (
    <View style={{ gap: 8 }}>
      {applePayAvailable && (
        <PlatformPayButton
          type={PlatformPay.ButtonType.Default}
          appearance={PlatformPay.ButtonStyle.White}
          borderRadius={12}
          style={{ height: 50, width: '100%' }}
          accessibilityLabel="Pay with Apple Pay"
          disabled={disabled || busy}
          onPress={() => void payWithApple()}
        />
      )}
      <Button variant={applePayAvailable ? 'secondary' : 'primary'} disabled={disabled} loading={busy}
        onPress={() => setCardFeeInFils(feeInFils)}>Pay by card</Button>
      {cardFeeInFils != null && (
        <CardPaymentScreen feeLabel={`AED ${cardFeeInFils / 100}`} busy={busy} disabled={disabled} error={error}
          onBack={() => setCardFeeInFils(null)} onPay={payByCard} />
      )}
    </View>
  );
}

export default function NativePaymentButtons(props: NativePaymentButtonsProps) {
  return (
    <StripeProvider publishableKey={config.stripePublishableKey}
      merchantIdentifier={config.applePayMerchantId || undefined} urlScheme="runout">
      <PaymentButtons {...props} />
    </StripeProvider>
  );
}
