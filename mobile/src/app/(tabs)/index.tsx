import { router } from 'expo-router';
import { Info, MapPin } from 'lucide-react-native';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/auth/AuthProvider';
import { Body, Button, Card, Eyebrow, InlineError, Monogram, Segmented } from '@/components/ui';
import { GlassSurface, useGlassPill } from '@/components/Glass';
import { useBookingDraft } from '@/features/booking/BookingDraftProvider';
import { TERMINAL_STATUSES } from '@/features/booking/model';
import { useReservations } from '@/features/reservations/api';
import { RevealEnvelopeCard } from '@/features/home/RevealEnvelopeCard';
import { EnvelopeReveal } from '@/features/home/EnvelopeReveal';
import { PitchCard } from '@/features/home/PitchCard';
import { HomeHeroPhoto } from '@/features/home/HomeHeroPhoto';
import { formatReservationWhen as formatWhen, ReservationListRow } from '@/features/reservations/ReservationListRow';
import { colors, radius } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

/** Height of the photo behind the top of Home (below the status bar). */
const HERO_PHOTO_HEIGHT = 340;

type Filter = 'upcoming' | 'previous' | 'all';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'previous', label: 'Previous' },
  { key: 'all', label: 'All' },
];


function revealCountdown(value: string | undefined, now: number) {
  if (!value) return 'Your next reveal is waiting';
  const remaining = Math.max(0, new Date(value).getTime() - now);
  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  return `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
}


export default function HomeScreen() {
  const { user } = useAuth();
  const { colors: themeColors, isLight } = useTheme();
  const insets = useSafeAreaInsets();
  const cityGlass = useGlassPill();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  const [filter, setFilter] = useState<Filter>('upcoming');
  const [envelopeOpen, setEnvelopeOpen] = useState(false);
  const { draft, reset } = useBookingDraft();
  const startBooking = () => { if (!user) reset(); router.push('/booking'); };
  const reservations = useReservations(Boolean(user));
  const visibleReservations = user ? (reservations.data ?? []) : [];
  const ordered = [...visibleReservations].sort((a, b) => new Date(a.reservationAt).getTime() - new Date(b.reservationAt).getTime());
  const upcoming = ordered.find((item) => !TERMINAL_STATUSES.includes(item.status) && new Date(item.reservationAt).getTime() > now);
  const previous = ordered.filter((item) => item.id !== upcoming?.id && (TERMINAL_STATUSES.includes(item.status) || new Date(item.reservationAt).getTime() < now)).reverse().slice(0, 3);
  const hasDraft = draft.step > 0 && !draft.reservationId;
  const showUpcoming = filter !== 'previous';
  const showPrevious = filter !== 'upcoming';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]} edges={['left', 'right']}>
      <ScrollView contentInsetAdjustmentBehavior="never" automaticallyAdjustContentInsets={false} contentContainerStyle={[styles.content, { paddingTop: insets.top + 10 }]} refreshControl={<RefreshControl tintColor={themeColors.gold} refreshing={reservations.isRefetching} onRefresh={() => void reservations.refetch()} />}>
        <HomeHeroPhoto height={insets.top + HERO_PHOTO_HEIGHT} background={themeColors.background} />
        <View style={styles.brandRow}>
          <View style={styles.brandLeft}><Monogram size={26} /><Text style={styles.brandWord}>RUN OUT</Text></View>
          <View style={[styles.cityPill, cityGlass]}><MapPin color={themeColors.gold} size={12} strokeWidth={2.2} /><Text style={styles.cityText}>Dubai</Text></View>
        </View>
        <GlassSurface radius={20} style={styles.heroGlass}>
          <Eyebrow>Mystery dinner</Eyebrow>
          <View style={styles.heroCopy}>
            <Text numberOfLines={2} style={[styles.heroTitle, isLight && { color: themeColors.text }]}>Your next great table is waiting.</Text>
            <Text numberOfLines={2} style={[styles.heroBody, { color: themeColors.glassText }]}>Choose the mood. We’ll handle the surprise.</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={startBooking} style={[styles.heroButton, { backgroundColor: themeColors.gold }]}><Text style={[styles.heroButtonText, { color: themeColors.primaryText }]}>{hasDraft && user ? 'Continue reservation' : 'Start reservation'}</Text></Pressable>
        </GlassSurface>

        {user && upcoming ? (
        <RevealEnvelopeCard
          countdown={upcoming ? revealCountdown(upcoming.confirmedReservationAt ?? upcoming.reservationAt, now) : undefined}
          when={upcoming ? formatWhen(upcoming.confirmedReservationAt ?? upcoming.reservationAt) : undefined}
          partySize={upcoming?.partySize}
          phrase=""
          onInvite={() => router.push(`/invite/${upcoming.id}`)}
          onOpen={() => setEnvelopeOpen(true)}
        />
        ) : <PitchCard />}


        <View style={[styles.listCard, { backgroundColor: themeColors.surface, borderColor: themeColors.line }]}>
          <Segmented options={FILTERS} value={filter} onChange={setFilter} />

          {user && reservations.error ? <InlineError message={reservations.error.message} onRetry={() => void reservations.refetch()} /> : null}

          {!user ? <View style={styles.guestHome}><Text style={styles.guestHomeTitle}>Your nights will appear here</Text><Text style={styles.empty}>Book a mystery table and we’ll keep the details safe in your account.</Text></View> : null}
          {user && !reservations.error && showUpcoming ? (upcoming ? (
            <View>
              <ReservationListRow item={upcoming} last />
              <View style={styles.note}><Info color={themeColors.muted} size={14} /><Text style={[styles.noteText, { color: themeColors.muted }]}>Restaurant details stay sealed until the reveal is available.</Text></View>
            </View>
          ) : <Text style={styles.empty}>Nothing booked yet. Start a reservation and let us plan the night.</Text>) : null}

          {user && !reservations.error && showPrevious ? (previous.length ? (
            <View>
              {previous.map((item, index) => <ReservationListRow key={item.id} item={item} last={index === previous.length - 1} />)}
              <Pressable onPress={() => router.push('/reservations')} style={styles.seeAll}><Text style={styles.link}>See all</Text></Pressable>
            </View>
          ) : <Text style={styles.empty}>Your completed reservations will appear here.</Text>) : null}
        </View>
        {!user ? <Card style={styles.guestAccountCard}><Text style={styles.guestAccountTitle}>Already have an account?</Text><Text style={styles.guestAccountCopy}>Sign in to see your reservations and keep every mystery night together.</Text><Button variant="secondary" onPress={() => router.push('/(auth)/access')}>Sign in</Button></Card> : null}
        {user && !reservations.data && !reservations.error ? <Body muted>Loading your nights…</Body> : null}
      </ScrollView>
      <EnvelopeReveal
        visible={envelopeOpen && Boolean(upcoming)}
        onClose={() => setEnvelopeOpen(false)}
        countdown={upcoming ? revealCountdown(upcoming.confirmedReservationAt ?? upcoming.reservationAt, now) : undefined}
        when={upcoming ? formatWhen(upcoming.confirmedReservationAt ?? upcoming.reservationAt) : undefined}
        partySize={upcoming?.partySize}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingBottom: 120, gap: 14 },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, paddingTop: 4, paddingBottom: 12 },
  brandLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandWord: { color: colors.white, fontSize: 12, fontWeight: '800', letterSpacing: 3, textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 6 },
  cityPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, height: 28, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)', backgroundColor: 'rgba(13,11,12,0.45)' },
  cityText: { color: colors.white, fontSize: 12, fontWeight: '600' },
  heroGlass: { marginTop: 160, paddingHorizontal: 16, paddingVertical: 14, gap: 8 },


  hero: { paddingHorizontal: 14, paddingVertical: 12, gap: 8, borderRadius: 18, overflow: 'hidden', backgroundColor: '#6E2238', shadowColor: '#5A1428', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
  heroShade: { position: 'absolute', right: -60, bottom: -90, width: 240, height: 200, borderRadius: 120, backgroundColor: '#2A0F1A', opacity: 0.6 },
  heroGlow: { position: 'absolute', right: -40, top: -50, width: 140, height: 140, borderRadius: 70, backgroundColor: colors.gold, opacity: 0.12 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroIcon: { width: 26, height: 26, borderRadius: 9, backgroundColor: 'rgba(255, 255, 255, 0.18)', alignItems: 'center', justifyContent: 'center' },
  heroCopy: { gap: 2 },
  heroTitle: { color: colors.white, fontSize: 15.5, lineHeight: 19, fontWeight: '800', letterSpacing: -0.3 },
  heroBody: { color: '#EFDCC8', fontSize: 12, lineHeight: 16 },
  heroButton: { alignSelf: 'flex-start', paddingHorizontal: 16, height: 34, borderRadius: radius.pill, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  heroButtonText: { color: colors.burgundy, fontSize: 12.5, fontWeight: '800' },


  listCard: { borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: '#1F1B1C', paddingHorizontal: 12, paddingTop: 12, paddingBottom: 4, gap: 4 },

  note: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', paddingHorizontal: 4, paddingTop: 8, paddingBottom: 8 },
  noteText: { flex: 1, color: '#77727A', fontSize: 11.5, lineHeight: 17 },
  empty: { color: colors.muted, fontSize: 13, lineHeight: 19, paddingHorizontal: 4, paddingVertical: 16 },
  guestHome: { paddingHorizontal: 4, paddingVertical: 10, gap: 2 }, guestHomeTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  guestAccountCard: { gap: 8, backgroundColor: colors.backgroundSecondary, borderColor: colors.border }, guestAccountTitle: { color: colors.text, fontSize: 15, fontWeight: '800' }, guestAccountCopy: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  seeAll: { alignItems: 'center', paddingTop: 12, paddingBottom: 8 },
  link: { color: colors.gold, fontSize: 12.5, fontWeight: '700' },
});
