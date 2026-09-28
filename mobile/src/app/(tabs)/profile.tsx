import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Bell, Leaf, LogOut, MapPin, Moon, Sun, UserRound } from 'lucide-react-native';
import { useAuth } from '@/auth/AuthProvider';
import { Body, Button, Card, Eyebrow, Field, InlineError, Screen, Title } from '@/components/ui';
import { useProfile, useUpdateProfile } from '@/features/profile/api';
import { colors, radius, spacing } from '@/theme/tokens';
import type { UserProfile } from '@/types/api';
import { useTheme } from '@/theme/ThemeProvider';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { colors: themeColors, isLight, setLight } = useTheme();
  const profile = useProfile(Boolean(user));
  if (!user) return <Screen><View style={styles.header}><Eyebrow>Your details</Eyebrow><Title>Profile</Title></View><Card><Text style={[styles.guestTitle, { color: themeColors.text }]}>Create your account when you’re ready to pay.</Text><Body muted>Your booking preferences are saved on this device while you explore as a guest.</Body><Button onPress={() => router.push('/(auth)/register')}>Create account</Button><Button variant="secondary" onPress={() => router.push('/(auth)/sign-in')}>Sign in</Button></Card><View style={styles.section}><View style={[styles.sectionIcon, { backgroundColor: themeColors.accentSurface }]}>{isLight ? <Sun color={themeColors.gold} size={15} strokeWidth={1.9} /> : <Moon color={themeColors.gold} size={15} strokeWidth={1.9} />}</View><Text style={[styles.sectionTitle, { color: themeColors.text }]}>Appearance</Text></View><Card style={styles.switchCard}><View style={styles.switchRow}><Text style={[styles.switchLabel, { color: themeColors.text }]}>Light mode</Text><Switch value={isLight} onValueChange={setLight} trackColor={{ true: themeColors.gold, false: themeColors.selectedBorder }} thumbColor={themeColors.text} /></View></Card></Screen>;
  return (
    <Screen>
      <View style={styles.header}><Eyebrow>Your details</Eyebrow><Title>Profile</Title></View>
      <Card style={styles.identity}><View style={[styles.avatar, { backgroundColor: themeColors.accentSurface, borderColor: themeColors.accentBorder }]}><UserRound color={themeColors.gold} size={20} strokeWidth={1.8} /></View><View style={styles.identityCopy}><Text numberOfLines={1} style={[styles.name, { color: themeColors.text }]}>{user?.displayName}</Text><Text numberOfLines={1} style={[styles.email, { color: themeColors.muted }]}>{user?.email}</Text></View></Card>
      {profile.error ? <InlineError message={profile.error.message} onRetry={() => void profile.refetch()} /> : null}
      {profile.data ? <ProfileEditor key={profile.data.address?.formattedAddress ?? 'profile'} initial={profile.data} /> : null}
      <View style={styles.section}><View style={[styles.sectionIcon, { backgroundColor: themeColors.accentSurface }]}>{isLight ? <Sun color={themeColors.gold} size={15} strokeWidth={1.9} /> : <Moon color={themeColors.gold} size={15} strokeWidth={1.9} />}</View><Text style={[styles.sectionTitle, { color: themeColors.text }]}>Appearance</Text></View>
      <Card style={styles.switchCard}><View style={styles.switchRow}><Text style={[styles.switchLabel, { color: themeColors.text }]}>Light mode</Text><Switch value={isLight} onValueChange={setLight} trackColor={{ true: themeColors.gold, false: themeColors.selectedBorder }} thumbColor={themeColors.text} /></View></Card>
      <Button variant="danger" onPress={() => void signOut()}><LogOut size={16} color={colors.danger} /> Sign out</Button>
      <Text style={styles.footnote}>Account deletion will be added only when the authenticated backend endpoint is available.</Text>
    </Screen>
  );
}

function ProfileEditor({ initial }: { initial: UserProfile }) {
  const { colors: themeColors } = useTheme();
  const update = useUpdateProfile();
  const [phone, setPhone] = useState(initial.phone ?? '');
  const [birthDate, setBirthDate] = useState(initial.birthDate ?? '');
  const [dietary, setDietary] = useState(initial.dietaryPreferences.join(', '));
  const [allergyNotes, setAllergyNotes] = useState(initial.allergyNotes ?? '');
  const [addressLabel, setAddressLabel] = useState(initial.address?.label ?? 'Home');
  const [formattedAddress, setFormattedAddress] = useState(initial.address?.formattedAddress ?? '');
  const [marketing, setMarketing] = useState(initial.marketingNotificationsEnabled ?? false);
  const [reservationNotifications, setReservationNotifications] = useState(initial.reservationNotificationsEnabled ?? true);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaved(false);
    await update.mutateAsync({
      phone: phone.trim() || null, birthDate: birthDate.trim() || null,
      dietaryPreferences: dietary.split(',').map((item) => item.trim()).filter(Boolean), allergyNotes: allergyNotes.trim() || null,
      marketingNotificationsEnabled: marketing, reservationNotificationsEnabled: reservationNotifications,
      address: formattedAddress.trim() ? { label: addressLabel.trim() || null, formattedAddress: formattedAddress.trim(), latitude: initial.address?.latitude ?? null, longitude: initial.address?.longitude ?? null } : null,
    });
    setSaved(true);
  };

  return <>
      <View style={styles.section}><View style={[styles.sectionIcon, { backgroundColor: themeColors.accentSurface }]}><Leaf color={themeColors.gold} size={15} strokeWidth={1.9} /></View><Text style={[styles.sectionTitle, { color: themeColors.text }]}>Preferences</Text></View>
      <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" />
      <Field label="Birth date" value={birthDate} onChangeText={setBirthDate} placeholder="YYYY-MM-DD" />
      <Field label="Dietary preferences" value={dietary} onChangeText={setDietary} placeholder="Vegetarian, gluten-free" />
      <Field label="Allergy notes" value={allergyNotes} onChangeText={setAllergyNotes} multiline maxLength={500} />
      <View style={styles.section}><View style={[styles.sectionIcon, { backgroundColor: themeColors.accentSurface }]}><MapPin color={themeColors.gold} size={15} strokeWidth={1.9} /></View><Text style={[styles.sectionTitle, { color: themeColors.text }]}>Saved address</Text></View>
      <Field label="Address label" value={addressLabel} onChangeText={setAddressLabel} />
      <Field label="Full address" value={formattedAddress} onChangeText={setFormattedAddress} multiline />
      <View style={styles.section}><View style={[styles.sectionIcon, { backgroundColor: themeColors.accentSurface }]}><Bell color={themeColors.gold} size={15} strokeWidth={1.9} /></View><Text style={[styles.sectionTitle, { color: themeColors.text }]}>Notifications</Text></View>
      <Card style={styles.switchCard}><View style={[styles.switchRow, styles.switchDivider]}><Text style={[styles.switchLabel, { color: themeColors.text }]}>Reservation updates</Text><Switch value={reservationNotifications} onValueChange={setReservationNotifications} trackColor={{ true: themeColors.gold, false: themeColors.selectedBorder }} thumbColor={themeColors.text} /></View><View style={styles.switchRow}><Text style={[styles.switchLabel, { color: themeColors.text }]}>Marketing</Text><Switch value={marketing} onValueChange={setMarketing} trackColor={{ true: themeColors.gold, false: themeColors.selectedBorder }} thumbColor={themeColors.text} /></View></Card>
      {update.error ? <InlineError message={update.error.message} /> : null}{saved ? <Text accessibilityRole="alert" style={styles.saved}>Profile saved.</Text> : null}
      <Button onPress={() => void save()} loading={update.isPending}>Save changes</Button>
    </>;
}
const styles = StyleSheet.create({
  header: { gap: 4 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  identityCopy: { flex: 1, minWidth: 0, gap: 2 },
  avatar: { width: 48, height: 48, borderRadius: radius.pill, backgroundColor: colors.accentSurface, borderWidth: 1, borderColor: colors.accentBorder, alignItems: 'center', justifyContent: 'center' },
  name: { color: colors.text, fontSize: 16, fontWeight: '700' },
  email: { color: colors.muted, fontSize: 12.5 },
  section: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: spacing.sm },
  sectionIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#2A1A14', alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  switchCard: { paddingVertical: 4, gap: 0 },
  switchRow: { minHeight: 52, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  switchLabel: { color: colors.text, fontSize: 14 },
  saved: { color: colors.success, fontSize: 13, fontWeight: '600' },
  footnote: { color: colors.faint, fontSize: 11.5, lineHeight: 16, textAlign: 'center' },
  guestTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
});
