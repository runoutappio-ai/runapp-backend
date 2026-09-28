import { router } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, EmptyState, Eyebrow, InlineError, Segmented, Title, TopGlow } from '@/components/ui';
import { TERMINAL_STATUSES } from '@/features/booking/model';
import { useReservations } from '@/features/reservations/api';
import { ReservationListRow } from '@/features/reservations/ReservationListRow';
import { colors, radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

type Filter = 'upcoming' | 'previous' | 'all';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'previous', label: 'Previous' },
  { key: 'all', label: 'All' },
];

export default function ReservationsScreen() {
  const { user } = useAuth();
  const { colors: themeColors } = useTheme();
  const query = useReservations(Boolean(user));
  const [now] = useState(() => Date.now());
  const [filter, setFilter] = useState<Filter>('all');
  const items = [...(query.data ?? [])].sort((a, b) => new Date(b.reservationAt).getTime() - new Date(a.reservationAt).getTime());
  const active = items.filter((item) => !TERMINAL_STATUSES.includes(item.status) && new Date(item.reservationAt).getTime() >= now - 3 * 60 * 60_000).reverse();
  const previous = items.filter((item) => !active.some((activeItem) => activeItem.id === item.id));
  const visible = filter === 'upcoming' ? active : filter === 'previous' ? previous : [...active, ...previous];
  const emptyCopy = filter === 'upcoming' ? 'No upcoming reservations.' : filter === 'previous' ? 'Your completed reservations will appear here.' : 'No reservations yet.';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]} edges={['top', 'left', 'right']}>
      <TopGlow />
      <ScrollView contentContainerStyle={[styles.content, { backgroundColor: themeColors.background }]} refreshControl={<RefreshControl tintColor={themeColors.gold} refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />}>
        <View style={styles.header}><Eyebrow>Your nights</Eyebrow><Title>Reservations</Title></View>
        {!user ? <EmptyState title="Your reservations are private" message="Sign in or create an account to view your nights." action={<Button onPress={() => router.push('/(auth)/register')}>Create account</Button>} /> : null}
        {user && query.error ? <InlineError message={query.error.message} onRetry={() => void query.refetch()} /> : null}
        {user && !query.isLoading && !items.length ? (
          <EmptyState title="No reservations yet" message="Book a mystery dinner from Home and it’ll show up here." action={<Button onPress={() => router.push('/booking')}>Start reservation</Button>} />
        ) : user ? (
          <View style={[styles.listCard, { backgroundColor: themeColors.surface, borderColor: themeColors.line }]}>
            <Segmented options={FILTERS} value={filter} onChange={setFilter} />
            {filter === 'all' && active.length ? <Text style={[styles.group, { color: themeColors.goldSoft } ]}>Upcoming & active</Text> : null}
            {visible.map((item, index) => (
              <View key={item.id}>
                {filter === 'all' && previous.length && item.id === previous[0]?.id ? <Text style={[styles.group, { color: themeColors.goldSoft }]}>Previous</Text> : null}
                <ReservationListRow item={item} last={index === visible.length - 1} />
              </View>
            ))}
            {!query.isLoading && !visible.length ? <Text style={[styles.empty, { color: themeColors.muted }]}>{emptyCopy}</Text> : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: spacing.lg, paddingBottom: 128, gap: 20 },
  header: { gap: 4 },
  listCard: { borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 6, gap: 6 },
  group: { color: colors.goldSoft, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', paddingHorizontal: 4, paddingTop: 12 },
  empty: { color: colors.muted, fontSize: 13, lineHeight: 19, paddingHorizontal: 4, paddingVertical: 16 },
});
