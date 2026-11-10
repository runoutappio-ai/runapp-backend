import { memo, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CardForm } from '@stripe/stripe-react-native';
import { Body, Button, Eyebrow, InlineError, Title } from '@/components/ui';
import { GlassSurface } from '@/components/Glass';
import { useTheme } from '@/theme/ThemeProvider';
import { type } from '@/theme/tokens';

type CardPaymentScreenProps = {
  feeLabel: string;
  busy: boolean;
  disabled: boolean;
  error: string;
  onBack: () => void;
  onPay: () => Promise<void>;
};

// Changing CardForm's native props during submission can recreate its iOS input view.
const SecureCardFields = memo(function SecureCardFields({ onComplete }: { onComplete: (complete: boolean) => void }) {
  const { colors } = useTheme();
  return (
    <CardForm style={styles.cardForm} cardStyle={{ borderRadius: 12, cursorColor: colors.gold }}
      onFormComplete={({ complete }) => onComplete(complete)} />
  );
});

export function CardPaymentScreen({ feeLabel, busy, disabled, error, onBack, onPay }: CardPaymentScreenProps) {
  const { colors } = useTheme();
  const [complete, setComplete] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const close = () => { if (!busy) onBack(); };

  return (
    <Modal animationType="slide" presentationStyle="fullScreen" onRequestClose={close}>
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView behavior="padding" style={styles.screen}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.back}>
              <Button variant="ghost" disabled={busy} onPress={close}>Back to payment</Button>
            </View>
            <View style={styles.heading}>
              <Eyebrow>Run Out checkout</Eyebrow>
              <Title>Pay by card</Title>
            </View>
            <GlassSurface radius={18} style={styles.summary}>
              <View style={styles.summaryRow}>
                <Body>Reservation fee</Body>
                <Text style={[type.titleMedium, { color: colors.gold }]}>{feeLabel}</Text>
              </View>
              <Body muted>Pay for your meal separately at the restaurant.</Body>
            </GlassSurface>
            <View pointerEvents={busy ? 'none' : 'auto'}>
              <SecureCardFields onComplete={setComplete} />
            </View>
            {attempted && error ? <InlineError message={error} /> : null}
            <Button disabled={disabled || !complete} loading={busy} onPress={() => {
              Keyboard.dismiss();
              setAttempted(true);
              void onPay();
            }}>Pay {feeLabel}</Button>
            <Text style={[styles.secure, { color: colors.muted }]}>Secure test payment powered by Stripe</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20, paddingBottom: 28, gap: 16 },
  back: { alignSelf: 'flex-start' },
  heading: { gap: 4 },
  summary: { padding: 16, gap: 6 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardForm: { height: 216 },
  secure: { ...type.caption, textAlign: 'center' },
});
