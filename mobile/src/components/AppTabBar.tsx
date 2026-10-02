import { router } from 'expo-router';
import { CalendarDays, Compass, Home, UserRound } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Monogram } from '@/components/ui';
import { useAuth } from '@/auth/AuthProvider';
import { useBookingDraft } from '@/features/booking/BookingDraftProvider';
import { colors } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { useGlassBar } from '@/components/Glass';

type Props = { active?: 'index' | 'reservations' | 'discover' | 'profile' };
const TABS = [
  { name: 'index', label: 'Home', Icon: Home },
  { name: 'reservations', label: 'Reservations', Icon: CalendarDays },
  { name: 'discover', label: 'Discover', Icon: Compass },
  { name: 'profile', label: 'Profile', Icon: UserRound },
] as const;

export function AppTabBar({ active }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors: themeColors } = useTheme();
  const { reset } = useBookingDraft();
  const glassBar = useGlassBar();
  const startBooking = () => { if (!user) reset(); router.push('/booking'); };
  const renderTab = ({ name, label, Icon }: (typeof TABS)[number]) => <Pressable key={name} accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected: active === name }} onPress={() => router.navigate((name === 'index' ? '/(tabs)' : `/(tabs)/${name}`) as never)} style={styles.tab}>
    <Icon color={active === name ? themeColors.text : themeColors.muted} size={23} strokeWidth={1.7} />
    <Text numberOfLines={1} style={[styles.label, { color: themeColors.muted }, active === name && { color: themeColors.text }]}>{label}</Text>
  </Pressable>;
  return <View style={[styles.bar, glassBar, { paddingBottom: Math.max(insets.bottom, 8), borderTopColor: themeColors.glassDivider }]}>
    {TABS.slice(0, 2).map(renderTab)}
    <View style={styles.centerSlot}><Pressable accessibilityRole="button" accessibilityLabel="Start a reservation" onPress={startBooking} style={({ pressed }) => [styles.centerButton, pressed && styles.pressed]}><Monogram /></Pressable></View>
    {TABS.slice(2).map(renderTab)}
  </View>;
}

const styles = StyleSheet.create({
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 50, elevation: 20, flexDirection: 'row', alignItems: 'flex-start', paddingTop: 8, backgroundColor: '#0E0C0D', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  tab: { flex: 1, alignItems: 'center', gap: 4, minHeight: 48, justifyContent: 'center' }, label: { color: colors.muted, fontSize: 10.5, fontWeight: '600' }, selectedLabel: { color: colors.text }, centerSlot: { flex: 1, alignItems: 'center' }, centerButton: { marginTop: -24, borderRadius: 18, shadowColor: colors.burgundy, shadowOpacity: 0.45, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 }, pressed: { opacity: 0.85 },
});
