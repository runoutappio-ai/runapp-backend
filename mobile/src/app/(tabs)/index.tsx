import { router } from 'expo-router';
import { Flame, Heart, Info, Mail, Sparkles, UsersRound } from 'lucide-react-native';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/auth/AuthProvider';
import { Body, Button, Card, Eyebrow, InlineError, Segmented, TopGlow } from '@/components/ui';
import { useBookingDraft } from '@/features/booking/BookingDraftProvider';
import { TERMINAL_STATUSES } from '@/features/booking/model';
import { useReservations } from '@/features/reservations/api';
import { formatReservationWhen as formatWhen, ReservationListRow } from '@/features/reservations/ReservationListRow';
import { colors, radius, spacing } from '@/theme/tokens';

type Filter = 'upcoming' | 'previous' | 'all';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'previous', label: 'Previous' },
  { key: 'all', label: 'All' },
];

const EMPTY_HOME_PHRASES = [
  'No plan yet? We know a place.',
  'Not sure where to go? Leave it to us.',
  'Your imagination called. It wants dinner.',
  'Still deciding? That is our favourite part.',
  'You bring the appetite. We bring the surprise.',
  'No endless scrolling. Just one great table.',
  'A little mystery makes a better night.',
  'Your next story starts with a reservation.',
  'Dinner plans are looking a little too predictable.',
  'Tell us your mood. We’ll handle the rest.',
  'Somewhere delicious is waiting for you.',
  'Bored of the usual? Perfect.',
  'Your lack of imagination is our opportunity.',
  'The best table tonight might be a secret.',
  'Choose a mood. Forget the menu hunt.',
  'No plan is still a plan. Let us improve it.',
  'One tap away from a better night out.',
  'Trust us with dinner for once.',
  'Good food. New place. Zero overthinking.',
  'You just found your excuse to go out.',
];

function revealCountdown(value: string | undefined, now: number) {
  if (!value) return 'Your next reveal is waiting';
  const remaining = Math.max(0, new Date(value).getTime() - now);
  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  return `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
}

const MOODS = [
  { label: 'Date night', vibe: 'Date Night', Icon: Heart, color: '#FF6697', background: '#311126' },
  { label: 'Friends', vibe: 'Casual', Icon: UsersRound, color: '#EBC46C', background: '#33240D' },
  { label: 'Spicy', vibe: 'Extreme', Icon: Flame, color: '#FF754E', background: '#351513' },
  { label: 'Surprise me', vibe: 'Birthday', Icon: Sparkles, color: '#A98CFF', background: '#1D1638' },
] as const;

export default function HomeScreen() {
  const { user } = useAuth();
  const [now, setNow] = useState(() => Date.now());
  const [phraseIndex, setPhraseIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const id = setInterval(() => setPhraseIndex((index) => (index + 1) % EMPTY_HOME_PHRASES.length), 4_500);
    return () => clearInterval(id);
  }, []);
  const [filter, setFilter] = useState<Filter>('upcoming');
  const { draft, update, reset } = useBookingDraft();
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
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <TopGlow />
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl tintColor={colors.gold} refreshing={reservations.isRefetching} onRefresh={() => void reservations.refetch()} />}>
        <View style={styles.revealHeader}>
          <View style={styles.revealCopy}>
            <View style={styles.revealLabel}><View style={styles.revealDot} /><Text style={styles.revealLabelText}>Next reveal in</Text></View>
            <Text numberOfLines={2} style={upcoming ? styles.countdown : styles.emptyPhrase}>{upcoming ? revealCountdown(upcoming.confirmedReservationAt ?? upcoming.reservationAt, now) : EMPTY_HOME_PHRASES[phraseIndex]}</Text>
            <Text numberOfLines={1} style={styles.revealMeta}>{upcoming ? `${formatWhen(upcoming.reservationAt)} · Table for ${upcoming.partySize}` : 'Your next great table is waiting.'}</Text>
          </View>
          {user && upcoming ? <Pressable accessibilityRole="button" onPress={() => router.push(`/invite/${upcoming.id}`)} style={styles.inviteButton}><Text style={styles.inviteText}>Invite</Text></Pressable> : null}
        </View>

        <View style={styles.hero}>
          <View pointerEvents="none" style={styles.heroShade} />
          <View pointerEvents="none" style={styles.heroGlow} />
          <View style={styles.heroTop}><Eyebrow>Mystery dinner</Eyebrow><View style={styles.heroIcon}><Mail color={colors.text} size={18} strokeWidth={1.8} /></View></View>
          <View style={styles.heroCopy}>
            <Text numberOfLines={2} style={styles.heroTitle}>Your next great table is waiting.</Text>
            <Text numberOfLines={2} style={styles.heroBody}>Choose the mood. We’ll handle the surprise.</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={startBooking} style={styles.heroButton}><Text style={styles.heroButtonText}>{hasDraft && user ? 'Continue reservation' : 'Start reservation'}</Text></Pressable>
        </View>

        {user ? <View style={styles.moods}>
          {MOODS.map(({ label, vibe, Icon, color, background }) => (
            <Pressable key={label} accessibilityRole="button" onPress={() => { reset(); update({ vibe }); router.push('/booking'); }} style={styles.mood}>
              <View style={[styles.moodIcon, { backgroundColor: background }]}><Icon color={color} size={21} strokeWidth={1.9} /></View>
              <Text numberOfLines={1} style={styles.moodLabel}>{label}</Text>
            </Pressable>
          ))}
        </View> : null}

        <View style={styles.listCard}>
          <Segmented options={FILTERS} value={filter} onChange={setFilter} />

          {user && reservations.error ? <InlineError message={reservations.error.message} onRetry={() => void reservations.refetch()} /> : null}

          {!user ? <View style={styles.guestHome}><Text style={styles.guestHomeTitle}>Your nights will appear here</Text><Text style={styles.empty}>Book a mystery table and we’ll keep the details safe in your account.</Text></View> : null}
          {user && !reservations.error && showUpcoming ? (upcoming ? (
            <View>
              <ReservationListRow item={upcoming} last />
              <View style={styles.note}><Info color={colors.muted} size={14} /><Text style={styles.noteText}>Restaurant details stay sealed until the reveal is available.</Text></View>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: spacing.lg, paddingBottom: 128, gap: 20 },

  revealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: spacing.md },
  revealCopy: { flex: 1, minWidth: 0, gap: 4 },
  revealLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  revealDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.gold, shadowColor: colors.gold, shadowOpacity: 0.9, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
  revealLabelText: { color: '#CDB89A', fontSize: 12, fontWeight: '600' },
  countdown: { color: colors.text, fontSize: 34, lineHeight: 38, fontWeight: '800', letterSpacing: -0.8 },
  emptyPhrase: { color: colors.text, fontSize: 20, lineHeight: 24, fontWeight: '800', letterSpacing: -0.4 },
  revealMeta: { color: colors.gold, fontSize: 12.5, fontWeight: '600' },
  inviteButton: { paddingHorizontal: 18, height: 40, borderRadius: radius.pill, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  inviteText: { color: colors.primaryText, fontSize: 13, fontWeight: '800' },

  hero: { padding: 20, gap: 14, borderRadius: 24, overflow: 'hidden', backgroundColor: '#6E2238', shadowColor: '#5A1428', shadowOpacity: 0.35, shadowRadius: 15, shadowOffset: { width: 0, height: 12 }, elevation: 6 },
  heroShade: { position: 'absolute', right: -60, bottom: -80, width: 260, height: 220, borderRadius: 130, backgroundColor: '#2A0F1A', opacity: 0.7 },
  heroGlow: { position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: colors.gold, opacity: 0.14 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.18)', alignItems: 'center', justifyContent: 'center' },
  heroCopy: { gap: 6 },
  heroTitle: { color: colors.white, fontSize: 20, lineHeight: 24, fontWeight: '800', letterSpacing: -0.3 },
  heroBody: { color: '#EFDCC8', fontSize: 13, lineHeight: 19 },
  heroButton: { alignSelf: 'flex-start', paddingHorizontal: 22, height: 44, borderRadius: radius.pill, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  heroButtonText: { color: colors.burgundy, fontSize: 14, fontWeight: '800' },

  moods: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  mood: { flex: 1, alignItems: 'center', gap: 6 },
  moodIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  moodLabel: { color: '#D6D2D3', fontSize: 11.5, fontWeight: '600', textAlign: 'center' },

  listCard: { borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: '#1F1B1C', paddingHorizontal: 14, paddingTop: 14, paddingBottom: 6, gap: 6 },

  note: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', paddingHorizontal: 4, paddingTop: 12, paddingBottom: 10 },
  noteText: { flex: 1, color: '#77727A', fontSize: 11.5, lineHeight: 17 },
  empty: { color: colors.muted, fontSize: 13, lineHeight: 19, paddingHorizontal: 4, paddingVertical: 16 },
  guestHome: { paddingHorizontal: 4, paddingVertical: 10, gap: 2 }, guestHomeTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  guestAccountCard: { gap: 8, backgroundColor: colors.backgroundSecondary, borderColor: colors.border }, guestAccountTitle: { color: colors.text, fontSize: 15, fontWeight: '800' }, guestAccountCopy: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  seeAll: { alignItems: 'center', paddingTop: 12, paddingBottom: 8 },
  link: { color: colors.gold, fontSize: 12.5, fontWeight: '700' },
});
