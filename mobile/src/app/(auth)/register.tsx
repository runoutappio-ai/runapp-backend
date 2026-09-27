import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/auth/AuthProvider';
import { Button, Eyebrow, Field, InlineError, Screen, Title } from '@/components/ui';
import { registrationFormSchema } from '@/auth/schemas';
import { useUpdateProfile } from '@/features/profile/api';
import { DUBAI_AREAS } from '@/features/booking/model';
import { colors } from '@/theme/tokens';

type FormValues = { firstName: string; lastName: string; email: string; password: string; confirmPassword: string; phone?: string };

export default function RegisterScreen() {
  const { register, busy } = useAuth();
  const updateProfile = useUpdateProfile();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const [apiError, setApiError] = useState('');
  const [area, setArea] = useState<(typeof DUBAI_AREAS)[number] | null>(null);
  const [showAreas, setShowAreas] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(registrationFormSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '', confirmPassword: '', phone: '' },
  });
  const submit = handleSubmit(async (values) => {
    setApiError('');
    try {
      await register(`${values.firstName.trim()} ${values.lastName.trim()}`, values.email.trim().toLowerCase(), values.password);
      await updateProfile.mutateAsync({
        phone: values.phone?.trim() || null,
        birthDate: null,
        dietaryPreferences: [],
        allergyNotes: null,
        marketingNotificationsEnabled: false,
        reservationNotificationsEnabled: true,
        address: area ? { label: area.name, formattedAddress: `${area.name}, Dubai, United Arab Emirates`, latitude: area.latitude, longitude: area.longitude } : null,
      });
      router.replace(returnTo === '/booking' ? '/booking' : '/(tabs)');
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Could not create your account.');
    }
  });
  return <Screen>
    <View style={{ gap: 4, marginBottom: 8 }}><Eyebrow>Join Run Out</Eyebrow><Title>Create your account</Title></View>
    <InlineError message="Use your details to receive reservation updates and invitations." />
    {apiError ? <InlineError message={apiError} /> : null}
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <View style={{ flex: 1 }}><Controller control={control} name="firstName" render={({ field }) => <Field label="First name" autoComplete="given-name" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} error={errors.firstName?.message} />} /></View>
      <View style={{ flex: 1 }}><Controller control={control} name="lastName" render={({ field }) => <Field label="Last name" autoComplete="family-name" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} error={errors.lastName?.message} />} /></View>
    </View>
    <Controller control={control} name="email" render={({ field }) => <Field label="Email" autoCapitalize="none" autoComplete="email" keyboardType="email-address" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} error={errors.email?.message} />} />
    <Controller control={control} name="password" render={({ field }) => <Field label="Password" secureTextEntry autoComplete="new-password" placeholder="12 characters or more" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} error={errors.password?.message} />} />
    <Controller control={control} name="confirmPassword" render={({ field }) => <Field label="Confirm password" secureTextEntry autoComplete="new-password" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} error={errors.confirmPassword?.message} />} />
    <Controller control={control} name="phone" render={({ field }) => <Field label="Phone (optional)" keyboardType="phone-pad" autoComplete="tel" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} error={errors.phone?.message} />} />
    <Field label="City" value="Dubai" editable={false} />
    <View style={{ gap: 7 }}><View><Field label="Neighbourhood (optional)" value={area?.name ?? ''} placeholder="Choose a Dubai area" editable={false} /></View><Pressable accessibilityRole="button" accessibilityLabel="Choose Dubai neighbourhood" onPress={() => setShowAreas((value) => !value)} style={{ position: 'absolute', right: 4, bottom: 4, padding: 12 }}><ChevronDown color={colors.muted} size={18} /></Pressable></View>
    {showAreas ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{DUBAI_AREAS.map((item) => <Button key={item.name} variant={area?.name === item.name ? 'primary' : 'secondary'} onPress={() => { setArea(item); setShowAreas(false); }}>{item.name}</Button>)}</View> : null}
    <Button onPress={submit} loading={busy || updateProfile.isPending}>Create account</Button>
  </Screen>;
}
