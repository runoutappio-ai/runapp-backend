import { useState } from 'react';
import { Alert, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CalendarClock, ChevronLeft, LockKeyhole, MapPinned, Users } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body, Button, Card, Eyebrow, InlineError, Title, TopGlow } from '@/components/ui';
import { AppTabBar } from '@/components/AppTabBar';
import { useGlassPill } from '@/components/Glass';
import { CANCELLABLE_STATUSES, STATUS_LABELS } from '@/features/booking/model';
import { useCancelReservation, useDemoReveal, useReservation, useReveal } from '@/features/reservations/api';
import { SealedEnvelope } from '@/features/home/SealedEnvelope';
import { Parchment } from '@/features/home/Parchment';
import { FeedbackForm } from '@/features/feedback/FeedbackForm';
import { colors, spacing } from '@/theme/tokens';
import { canRenderRestaurant, getRevealStage } from '@/features/reservations/privacy';
import { config } from '@/config';
import { ApiError } from '@/api/client';

function formatWhen(value: string) {
  return new Intl.DateTimeFormat('en-AE', { timeZone: 'Asia/Dubai', dateStyle: 'full', timeStyle: 'short' }).format(new Date(value));
}
export default function ReservationDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const reservation = useReservation(id);
  const reveal = useReveal(id);
  const demoReveal = useDemoReveal(id);
  const cancellation = useCancelReservation(id);
  const [cancelled, setCancelled] = useState(false);
  const [demoMenuRevealed, setDemoMenuRevealed] = useState(false);
  const glassPill = useGlassPill();
  const data = reservation.data;
  const revealStage = getRevealStage(reveal.data, demoReveal.data, demoMenuRevealed);
  const revealData = canRenderRestaurant(reveal.data) ? reveal.data : (demoReveal.data ?? reveal.data);
  const revealed = canRenderRestaurant(revealData) ? revealData! : null;
  const demoError = demoReveal.error instanceof ApiError && demoReveal.error.status === 404
    ? 'Demo reveal is not active on this backend. Restart the local API after updating it.'
    : demoReveal.error?.message;
  const refresh = async () => { await Promise.all([reservation.refetch(), reveal.refetch()]); };
  const openMap = async () => {
    const restaurant = revealed?.restaurant;
    if (!restaurant) return;
    const browser = restaurant.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.formattedAddress ?? restaurant.name)}`;
    const native = restaurant.latitude != null && restaurant.longitude != null ? `comgooglemaps://?q=${restaurant.latitude},${restaurant.longitude}` : '';
    await Linking.openURL(native && await Linking.canOpenURL(native) ? native : browser);
  };
  const cancel = () => Alert.alert('Cancel reservation?', 'This cannot be undone.', [{ text: 'Keep reservation', style: 'cancel' }, { text: 'Cancel reservation', style: 'destructive', onPress: () => void cancellation.mutateAsync().then(() => setCancelled(true)) }]);
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <TopGlow />
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={[styles.backButton, glassPill]}><ChevronLeft color={colors.text} size={22} /></Pressable>
        <Text style={styles.topTitle}>Reservation</Text>
        <View style={styles.topSpacer} />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} refreshControl={<RefreshControl tintColor={colors.gold} refreshing={reservation.isRefetching || reveal.isRefetching} onRefresh={() => void refresh()} />}>
        {(reservation.error || reveal.error) ? <InlineError message={(reservation.error || reveal.error)?.message ?? 'Could not load this reservation.'} onRetry={() => void refresh()} /> : null}
        {data ? <><View style={styles.header}><Eyebrow>{STATUS_LABELS[data.status]}</Eyebrow><Title>{revealStage === 'menu' ? 'The wait is over.' : revealStage === 'restaurant' ? 'Your restaurant is revealed.' : 'Still under wraps'}</Title></View>
          <Card style={styles.facts}><View style={[styles.fact, styles.factDivider]}><View style={styles.factIcon}><CalendarClock color={colors.gold} size={16} strokeWidth={1.9} /></View><Text style={styles.factText}>{formatWhen(data.confirmedReservationAt ?? data.reservationAt)}</Text></View><View style={styles.fact}><View style={styles.factIcon}><Users color={colors.gold} size={16} strokeWidth={1.9} /></View><Text style={styles.factText}>Table for {data.partySize} · AED {data.totalBudget.amount} total</Text></View></Card>
          {revealed?.restaurant ? <>
            <SealedEnvelope key={revealStage} open letterTitle={revealStage === 'menu' ? 'YOUR MENU' : 'RESTAURANT'}>
              <Parchment restaurant={revealed.restaurant} menu={revealed.menu} menuSealed={revealStage === 'restaurant'} />
              <Button onPress={() => void openMap()}><MapPinned size={16} color={colors.primaryText} /> Open in Google Maps</Button>
              {revealStage === 'restaurant' ? <Button variant="secondary" onPress={() => setDemoMenuRevealed(true)}><LockKeyhole size={15} color={colors.gold} /> Skip the menu wait · demo</Button> : null}
            </SealedEnvelope>
            {data.dietaryPreferences.length ? <Card><Text style={styles.section}>Dietary preferences</Text><Body muted>Shared with the planning team: {data.dietaryPreferences.join(', ')}. Always confirm severe allergies directly with the restaurant.</Body></Card> : null}
          </> : <Card style={styles.sealed}><SealedEnvelope /><Text style={styles.sealedTitle}>Your restaurant and menu are sealed</Text><Body muted>{data.status === 'CONFIRMED' && data.confirmedReservationAt ? `The envelope opens automatically at ${formatWhen(data.confirmedReservationAt)}.` : 'Payment received. We’re preparing the restaurant and menu that will go inside your envelope.'}</Body>{config.demoSkipWait ? <Button variant="secondary" loading={demoReveal.isPending} onPress={() => { setDemoMenuRevealed(false); demoReveal.mutate(); }}>Skip the wait · demo</Button> : null}{demoError ? <InlineError message={demoError} /> : null}</Card>}
          {data.status === 'COMPLETED' ? data.feedback ? <Card><Text style={styles.section}>Your feedback · {data.feedback.rating}/5</Text>{data.feedback.comment ? <Body>{data.feedback.comment}</Body> : null}<Body muted>{data.feedback.wouldReturnForSurpriseMenu ? 'Open to another surprise menu' : 'Would prefer a different restaurant next time'}</Body></Card> : <FeedbackForm reservationId={data.id} /> : null}
          {CANCELLABLE_STATUSES.includes(data.status) && revealStage === 'sealed' && !cancelled ? <><Button variant="danger" onPress={cancel} loading={cancellation.isPending}>Cancel reservation</Button>{cancellation.error ? <InlineError message={cancellation.error.message} /> : null}</> : null}
        </> : null}
      </ScrollView>
      <AppTabBar />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: { height: 52, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  topSpacer: { width: 40, height: 40 },
  topTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: spacing.sm, paddingBottom: 150, gap: spacing.md },
  header: { gap: 4 },
  facts: { paddingVertical: 4, gap: 0 },
  fact: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 12 },
  factDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255, 255, 255, 0.1)' },
  factIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(235, 196, 108, 0.16)', alignItems: 'center', justifyContent: 'center' },
  factText: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '600' },
  section: { color: colors.text, fontSize: 16, fontWeight: '700' },
  sealed: { alignItems: 'center', gap: 10 },
  sealedTitle: { color: colors.text, fontSize: 17, fontWeight: '700', textAlign: 'center' },
});
