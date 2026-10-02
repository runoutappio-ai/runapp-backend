import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/auth/AuthProvider';
import { BackButton, Button, Eyebrow, Field, InlineError, Screen, Title } from '@/components/ui';
import { colors, spacing } from '@/theme/tokens';
import { loginSchema } from '@/auth/schemas';
import { TestLoginButton } from '@/features/auth/TestLoginButton';

type FormValues = { email: string; password: string };
export default function SignInScreen() {
  const { signIn, busy } = useAuth();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const [secure, setSecure] = useState(true);
  const [apiError, setApiError] = useState('');
  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });
  const submit = handleSubmit(async (values) => {
    setApiError('');
    try { await signIn(values.email.trim().toLowerCase(), values.password); router.replace(returnTo === '/booking' ? '/booking' : '/(tabs)'); } catch (error) { setApiError(error instanceof Error ? error.message : 'Sign-in failed.'); }
  });
  return (
    <Screen>
      <BackButton />
      <View style={{ gap: 4, marginBottom: 8 }}><Eyebrow>Welcome back</Eyebrow><Title>Sign in</Title></View>
      {apiError ? <InlineError message={apiError} /> : null}
      <Controller control={control} name="email" render={({ field }) => <Field label="Email" autoCapitalize="none" autoComplete="email" keyboardType="email-address" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} error={errors.email?.message} />} />
      <View><Controller control={control} name="password" render={({ field }) => <Field label="Password" secureTextEntry={secure} autoComplete="current-password" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} error={errors.password?.message} />} /><Pressable accessibilityRole="button" accessibilityLabel={secure ? 'Show password' : 'Hide password'} style={styles.eye} onPress={() => setSecure((value) => !value)}>{secure ? <Eye color={colors.muted} size={19} /> : <EyeOff color={colors.muted} size={19} />}</Pressable></View>
      <Button onPress={submit} loading={busy}>Sign in</Button>
      <TestLoginButton />
    </Screen>
  );
}
const styles = StyleSheet.create({ eye: { position: 'absolute', right: spacing.sm, top: 26, padding: spacing.sm } });
