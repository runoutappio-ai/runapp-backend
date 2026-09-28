import { router } from 'expo-router';
import { ChevronRight, LockKeyhole, Star, UtensilsCrossed, XCircle } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { STATUS_LABELS, TERMINAL_STATUSES } from '@/features/booking/model';
import { colors } from '@/theme/tokens';
import type { Reservation } from '@/types/api';
import { useTheme } from '@/theme/ThemeProvider';

export function formatReservationWhen(value: string) {
  return new Intl.DateTimeFormat('en-AE', { timeZone: 'Asia/Dubai', weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

const NEGATIVE = ['CANCELLED', 'REJECTED', 'PAYMENT_FAILED'];

/** One reservation line: icon · date + detail · amount + status. Used on Home and Reservations. */
export function ReservationListRow({ item, last = false }: { item: Reservation; last?: boolean }) {
  const { colors: themeColors } = useTheme();
  const terminal = TERMINAL_STATUSES.includes(item.status);
  const negative = NEGATIVE.includes(item.status);
  const completed = item.status === 'COMPLETED';
  const Icon = negative ? XCircle : terminal ? UtensilsCrossed : LockKeyhole;
  const detail = terminal ? `Table for ${item.partySize}` : `Table for ${item.partySize} · Sealed until reveal`;
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push(`/reservation/${item.id}`)} style={({ pressed }) => [styles.row, { borderBottomColor: themeColors.border }, last && styles.last, pressed && styles.pressed]}>
      <View style={[styles.icon, { backgroundColor: themeColors.line }, !terminal && { backgroundColor: themeColors.accentSurface }]}><Icon color={terminal ? (negative ? themeColors.muted : themeColors.text) : themeColors.gold} size={17} strokeWidth={1.9} /></View>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={[styles.title, { color: themeColors.text }]}>{formatReservationWhen(item.confirmedReservationAt ?? item.reservationAt)}</Text>
        <Text numberOfLines={1} style={[styles.meta, { color: themeColors.muted }]}>{detail}</Text>
      </View>
      <View style={styles.end}>
        <Text style={[styles.amount, { color: themeColors.text }]}>AED {item.totalBudget.amount}</Text>
        {completed ? item.feedback ? (
          <View style={styles.rating}><Star fill={colors.gold} color={colors.gold} size={11} /><Text style={styles.ratingText}>{item.feedback.rating}/5 · Feedback submitted</Text></View>
        ) : <Text style={styles.action}>Leave feedback</Text> : (
          <Text numberOfLines={1} style={[styles.status, negative ? styles.statusNegative : terminal ? styles.statusMuted : styles.statusOk]}>{STATUS_LABELS[item.status]}</Text>
        )}
      </View>
      <ChevronRight color={colors.faint} size={16} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 4, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  last: { borderBottomWidth: 0 },
  pressed: { opacity: 0.7 },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  iconSealed: { backgroundColor: '#2A1A14' },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  title: { color: colors.text, fontFamily: 'Avenir Next', fontSize: 14, fontWeight: '700' },
  meta: { color: colors.muted, fontFamily: 'Avenir Next', fontSize: 12 },
  end: { alignItems: 'flex-end', gap: 2, maxWidth: 130 },
  amount: { color: colors.text, fontFamily: 'Avenir Next', fontSize: 14, fontWeight: '700' },
  status: { fontSize: 11, fontWeight: '600' },
  statusOk: { color: colors.success },
  statusMuted: { color: colors.muted },
  statusNegative: { color: colors.danger },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { color: colors.muted, fontSize: 10.5, fontWeight: '600' },
  action: { color: colors.gold, fontSize: 11, fontWeight: '700' },
});
