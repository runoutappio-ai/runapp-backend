import { useMemo, useState } from 'react';
import {
  type AccessibilityActionEvent,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { randomUUID } from 'expo-crypto';
import {
  Check,
  ChevronDown,
  ChevronLeft,
  CreditCard,
  LocateFixed,
  LockKeyhole,
  MapPin,
  Minus,
  Plus,
  Smartphone,
  WalletCards,
  X,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/auth/AuthProvider';
import { api } from '@/api/client';
import { queryClient } from '@/api/query';
import { Body, Button, Card, Eyebrow, Field, InlineError, Title } from '@/components/ui';
import { AppTabBar } from '@/components/AppTabBar';
import { useBookingDraft } from '@/features/booking/BookingDraftProvider';
import { locationPatch } from '@/features/booking/location';
import { CUISINES, DIETARY, DUBAI_AREAS, VIBES, dubaiIso, toReservationPayload } from '@/features/booking/model';
import { scheduleReservationReminders } from '@/features/booking/notifications';
import { mockPaymentProvider, requireCapturedPayment } from '@/features/booking/payment';
import { createReservation, payReservation, reservationKeys } from '@/features/reservations/api';
import { colors, radius, spacing } from '@/theme/tokens';
import type { LocationCandidate } from '@/types/api';

const STEPS = ['Your table', 'Budget & mood', 'Location', 'Payment'];
const VIBE_EMOJI: Record<string, string> = {
  Casual: '😎',
  'Date Night': '💞',
  Extreme: '🔥',
  Birthday: '🎉',
  'Dress to Impress': '🎩',
};
const PAYMENT_METHODS = [
  { id: 'card', label: 'Credit card', Icon: CreditCard },
  { id: 'apple-pay', label: 'Apple Pay', Icon: Smartphone },
  { id: 'google-pay', label: 'Google Pay', Icon: WalletCards },
] as const;

function dateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function displayDate(date: Date) {
  return new Intl.DateTimeFormat('en-AE', { day: '2-digit', month: 'short' }).format(date);
}
function timeString(totalMinutes: number) {
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
}
function endTime(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return timeString(Math.min(23 * 60, hours * 60 + minutes + 60));
}
function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: selected }} onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function DiscreteRail({
  value,
  minimum,
  maximum,
  step,
  onChange,
  label,
}: {
  value: number;
  minimum: number;
  maximum: number;
  step: number;
  onChange: (value: number) => void;
  label: string;
}) {
  const [width, setWidth] = useState(1);
  const clamped = Math.min(maximum, Math.max(minimum, value));
  const position = ((clamped - minimum) / Math.max(1, maximum - minimum)) * 100;
  const updateFromX = (x: number) => {
    const raw = minimum + (Math.max(0, Math.min(width, x)) / width) * (maximum - minimum);
    onChange(Math.min(maximum, Math.max(minimum, Math.round(raw / step) * step)));
  };
  const onAccessibilityAction = (event: AccessibilityActionEvent) => {
    const delta = event.nativeEvent.actionName === 'increment' ? step : -step;
    onChange(Math.min(maximum, Math.max(minimum, clamped + delta)));
  };
  return (
    <Pressable
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min: minimum, max: maximum, now: clamped }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={onAccessibilityAction}
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      onPress={(event: GestureResponderEvent) => updateFromX(event.nativeEvent.locationX)}
      style={styles.railTouch}>
      <View style={styles.rail} />
      <View style={[styles.railFill, { width: `${position}%` }]} />
      <View style={[styles.railDot, { left: `${position}%` }]} />
    </Pressable>
  );
}

export default function BookingScreen() {
  const { user } = useAuth();
  const { draft, update, reset } = useBookingDraft();
  const step = Math.min(draft.step, STEPS.length - 1);
  const [error, setError] = useState('');
  const [locationStatus, setLocationStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showAreas, setShowAreas] = useState(!draft.locationLabel);
  const [pickingTastes, setPickingTastes] = useState(draft.excludedCuisineTypes.length > 0);
  const [dietaryOpen, setDietaryOpen] = useState(draft.dietaryPreferences.length > 0 || Boolean(draft.allergyNotes));
  const [now] = useState(() => Date.now());
  const today = useMemo(() => { const date = new Date(); date.setHours(0, 0, 0, 0); return date; }, []);
  const quickDates = useMemo(() => Array.from({ length: 6 }, (_, index) => { const date = new Date(today); date.setDate(today.getDate() + index); return date; }), [today]);
  const effectiveDate = draft.date || dateString(quickDates[1]);
  const selectedDate = new Date(`${effectiveDate}T12:00:00`);
  const [selectedHours, selectedMinutes] = draft.time.split(':').map(Number);
  const timeMinutes = Math.min(22 * 60, Math.max(7 * 60, selectedHours * 60 + selectedMinutes));
  const minBudget = draft.partySize * 50;

  const next = () => {
    setError('');
    update({ step: Math.min(step + 1, STEPS.length - 1), ...(step === 0 && !draft.date ? { date: effectiveDate } : {}) });
    void Haptics.selectionAsync();
  };
  const back = () => {
    if (step === 0) router.back();
    else update({ step: step - 1 });
  };
  const toggle = (field: 'excludedCuisineTypes' | 'dietaryPreferences', value: string, limit = Infinity) => {
    const current = draft[field];
    update({ [field]: current.includes(value) ? current.filter((item) => item !== value) : current.length < limit ? [...current, value] : current } as Partial<typeof draft>);
  };
  const selectArea = async (area: (typeof DUBAI_AREAS)[number]) => {
    update({ locationLabel: `${area.name}, Dubai, United Arab Emirates`, latitude: area.latitude, longitude: area.longitude });
    setLocationStatus(`Using ${area.name}.`);
    setShowAreas(false);
    try {
      const matches = await api<LocationCandidate[]>(`/api/v1/locations/search?query=${encodeURIComponent(`${area.name}, Dubai, UAE`)}`);
      if (matches[0]) update({ locationLabel: matches[0].label, latitude: matches[0].latitude, longitude: matches[0].longitude });
    } catch { /* Built-in Dubai coordinates remain a complete offline fallback. */ }
  };
  const locateDevice = async () => {
    setLocationStatus('Requesting location…');
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') {
      setLocationStatus('Location permission was denied. Choose a Dubai area instead.');
      return;
    }
    try {
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const candidate = await api<LocationCandidate>('/api/v1/locations/reverse-geocode', { method: 'POST', body: JSON.stringify({ latitude: current.coords.latitude, longitude: current.coords.longitude }) });
      update(locationPatch(candidate));
      setLocationStatus(candidate.label);
    } catch (cause) {
      setLocationStatus(cause instanceof Error ? cause.message : 'Could not identify the street. Choose a Dubai area.');
    }
  };
  const confirm = async () => {
    setError('');
    if (!user) {
      router.push('/(auth)/access?returnTo=/booking' as never);
      return;
    }
    if (!draft.paymentMethod) { setError('Choose a demo payment method first.'); return; }
    setSubmitting(true);
    try {
      const createKey = draft.createIdempotencyKey ?? randomUUID();
      const paymentKey = draft.paymentIdempotencyKey ?? randomUUID();
      update({ createIdempotencyKey: createKey, paymentIdempotencyKey: paymentKey });
      let reservationId = draft.reservationId;
      if (!reservationId) {
        const created = await createReservation(toReservationPayload(draft), createKey);
        reservationId = created.id;
        update({ reservationId });
      }
      const token = await mockPaymentProvider.createPaymentMethodToken(draft.paymentMethod);
      const paid = await payReservation(reservationId, token, paymentKey);
      requireCapturedPayment(paid.payment?.status);
      await queryClient.invalidateQueries({ queryKey: reservationKeys.all });
      await scheduleReservationReminders(paid).catch(() => undefined);
      reset();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/reservation/${paid.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not complete the reservation.');
    } finally {
      setSubmitting(false);
    }
  };

  const reservationInFuture = new Date(dubaiIso(effectiveDate, draft.time)).getTime() > now;
  const canContinue = step === 0
    ? reservationInFuture
    : step === 1
      ? draft.totalBudget >= minBudget && draft.totalBudget <= 1000
      : step === 2
        ? Boolean(draft.locationLabel && draft.latitude != null && draft.longitude != null)
        : Boolean(draft.paymentMethod);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.top}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={back} style={styles.topButton}><ChevronLeft color={colors.text} size={22} /></Pressable>
        <View style={styles.progressCopy}><Text style={styles.progressStep}>Step {step + 1} of {STEPS.length}</Text><Text style={styles.progress}>{STEPS[step]}</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Close booking" onPress={() => router.replace('/')} style={styles.topButton}><X color={colors.text} size={20} /></Pressable>
      </View>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${((step + 1) / STEPS.length) * 100}%` }]} /></View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {step === 0 ? (
          <>
            <View style={styles.stepHeader}>
              <Eyebrow>Your table</Eyebrow>
              <Title>Who, and when?</Title>
              <Body muted>Tables for two to six. We’ll size everything else to your party.</Body>
            </View>
            <View style={styles.peopleCounter}>
              <Pressable accessibilityLabel="Remove one guest" disabled={draft.partySize <= 2} onPress={() => update({ partySize: draft.partySize - 1, totalBudget: Math.max((draft.partySize - 1) * 50, draft.totalBudget) })} style={[styles.counterButton, draft.partySize <= 2 && styles.disabled]}><Minus color={colors.gold} size={20} /></Pressable>
              <View style={styles.peopleValue}><Text style={styles.count}>{draft.partySize}</Text><Text style={styles.peopleLabel}>people</Text><Text style={styles.peopleEmoji}>{Array.from({ length: draft.partySize }, () => '🧑').join(' ')}</Text></View>
              <Pressable accessibilityLabel="Add one guest" disabled={draft.partySize >= 6} onPress={() => update({ partySize: draft.partySize + 1, totalBudget: Math.max((draft.partySize + 1) * 50, draft.totalBudget) })} style={[styles.counterButton, draft.partySize >= 6 && styles.disabled]}><Plus color={colors.gold} size={20} /></Pressable>
            </View>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>When?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickDates}>
              {quickDates.map((date, index) => {
                const selected = effectiveDate === dateString(date);
                const label = index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : new Intl.DateTimeFormat('en-AE', { weekday: 'short' }).format(date);
                return <Pressable key={date.toISOString()} onPress={() => update({ date: dateString(date) })} style={[styles.dateChip, selected && styles.dateChipSelected]}><Text style={[styles.dateLabel, selected && styles.selectedText]}>{label}</Text><Text style={[styles.dateValue, selected && styles.selectedText]}>{displayDate(date)}</Text></Pressable>;
              })}
            </ScrollView>
            <Text style={styles.fieldHint}>Or choose another date</Text>
            <View style={styles.datePicker}><DateTimePicker value={selectedDate} minimumDate={today} mode="date" display="compact" themeVariant="dark" onValueChange={(_, date) => update({ date: dateString(date) })} /></View>
            <View style={styles.timeHeader}><Text style={styles.sliderTitle}>Start time</Text><Text style={styles.sliderValue}>{draft.time}–{endTime(draft.time)}</Text></View>
            <View style={styles.mealBadge}><Text style={styles.mealBadgeText}>{timeMinutes < 11 * 60 ? 'BREAKFAST' : timeMinutes < 16 * 60 ? 'LUNCH' : 'DINNER'}</Text></View>
            <DiscreteRail value={timeMinutes} minimum={7 * 60} maximum={22 * 60} step={15} label="Reservation start time" onChange={(value) => update({ time: timeString(value) })} />
            <View style={styles.railLabels}><Text style={styles.railLabel}>07:00</Text><Text style={styles.railLabel}>11:00</Text><Text style={styles.railLabel}>15:00</Text><Text style={styles.railLabel}>19:00</Text><Text style={styles.railLabel}>23:00</Text></View>
            {!reservationInFuture ? <InlineError message="Choose a future time in Dubai." /> : null}
          </>
        ) : null}

        {step === 1 ? (
          <>
            <View style={styles.stepHeader}>
              <Eyebrow>Budget & mood</Eyebrow>
              <Title>How much, and what mood?</Title>
              <Body muted>Steps of AED 50 — minimum AED 50 a person, cap AED 1,000.</Body>
            </View>
            <View style={styles.sliderLabelRow}><Text style={styles.sliderTitle}>Maximum table budget</Text><Text style={styles.sliderValue}>AED {draft.totalBudget}</Text></View>
            <DiscreteRail value={draft.totalBudget} minimum={minBudget} maximum={1000} step={50} label="Maximum table budget" onChange={(totalBudget) => update({ totalBudget })} />
            <View style={styles.tipBubble}><Text style={styles.tipText}>{draft.totalBudget <= minBudget ? '🥤 The waiter will refill your water and nothing else.' : draft.totalBudget < 400 ? '🍜 Relaxed, delicious, and comfortably within budget.' : '🥂 A table made for a proper night out.'}</Text></View>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Outing vibe</Text>
            <View style={styles.chips}>{VIBES.map((vibe) => <Chip key={vibe} label={`${VIBE_EMOJI[vibe]} ${vibe}`} selected={draft.vibe === vibe} onPress={() => update({ vibe })} />)}</View>
            <View style={styles.tipBubble}><Text style={styles.tipText}>{VIBE_EMOJI[draft.vibe]} {draft.vibe === 'Casual' ? 'Zero dress code, zero stress — flip-flops fully authorized.' : `We’ll shape the surprise around a ${draft.vibe.toLowerCase()} mood.`}</Text></View>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Tastes</Text>
            <Body muted>Anything you’d rather rule out tonight?</Body>
            <View style={styles.segmented}>
              <Pressable onPress={() => { setPickingTastes(false); update({ excludedCuisineTypes: [] }); }} style={[styles.segment, !pickingTastes && styles.segmentSelected]}><Text style={styles.segmentText}>No, open to anything</Text></Pressable>
              <Pressable onPress={() => setPickingTastes(true)} style={[styles.segment, pickingTastes && styles.segmentSelected]}><Text style={styles.segmentText}>Yes, let me pick</Text></Pressable>
            </View>
            {pickingTastes ? <><View style={styles.chips}>{CUISINES.map((cuisine) => <Chip key={cuisine} label={cuisine} selected={draft.excludedCuisineTypes.includes(cuisine)} onPress={() => toggle('excludedCuisineTypes', cuisine, 3)} />)}</View><Body muted>{draft.excludedCuisineTypes.length}/3 excluded</Body></> : null}
            <Pressable onPress={() => { setDietaryOpen((current) => !current); if (dietaryOpen) update({ dietaryPreferences: [], allergyNotes: '' }); }} style={styles.allergyToggle}><View style={[styles.checkbox, dietaryOpen && styles.checkboxChecked]}>{dietaryOpen ? <Check size={14} color={colors.primaryText} strokeWidth={3} /> : null}</View><Text style={styles.allergyText}>⚠️ Allergies or dietary conditions?</Text></Pressable>
            {dietaryOpen ? <><View style={styles.chips}>{DIETARY.map((diet) => <Chip key={diet} label={diet} selected={draft.dietaryPreferences.includes(diet)} onPress={() => toggle('dietaryPreferences', diet)} />)}</View><Field label="Allergy notes" value={draft.allergyNotes} onChangeText={(allergyNotes) => update({ allergyNotes })} multiline maxLength={500} placeholder="Tell us what the restaurant needs to know" /></> : null}
          </>
        ) : null}

        {step === 2 ? (
          <>
            <View style={styles.stepHeader}>
              <Eyebrow>Location</Eyebrow>
              <Title>First — where are you?</Title>
              <Body muted>We need to know this to measure how far away your restaurant is.</Body>
            </View>
            <Text style={styles.fieldHint}>Choose your area in Dubai</Text>
            <Pressable accessibilityRole="button" onPress={() => setShowAreas((current) => !current)} style={styles.areaSelect}><Text style={[styles.areaSelectText, !draft.locationLabel && styles.mutedText]} numberOfLines={1}>{draft.locationLabel || 'Select an area'}</Text><ChevronDown color={colors.muted} size={18} /></Pressable>
            {showAreas ? <View style={styles.areaGrid}>{DUBAI_AREAS.map((area) => <Chip key={area.name} label={area.name} selected={draft.locationLabel.startsWith(area.name)} onPress={() => void selectArea(area)} />)}</View> : null}
            <View style={styles.orRow}><View style={styles.orLine} /><Text style={styles.orText}>OR</Text><View style={styles.orLine} /></View>
            <Button variant="secondary" onPress={() => void locateDevice()}><LocateFixed color={colors.text} size={16} /> Use my current location</Button>
            {locationStatus ? <Card><View style={styles.inline}><MapPin color={colors.gold} size={16} /><Body>{locationStatus}</Body></View></Card> : null}
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>How far are you willing to travel?</Text>
            <Body muted>Set the farthest you’re willing to travel from there.</Body>
            <View style={styles.sliderLabelRow}><Text style={styles.sliderTitle}>Travel distance</Text><Text style={styles.sliderValue}>{draft.radiusKm} km</Text></View>
            <DiscreteRail value={draft.radiusKm} minimum={1} maximum={25} step={1} label="Maximum travel distance in kilometres" onChange={(radiusKm) => update({ radiusKm })} />
            <View style={styles.distanceLabels}><Text style={styles.railLabel}>1 km</Text><Text style={styles.railLabel}>25 km</Text></View>
            <View style={styles.chipsCentered}>{[1, 3, 5, 10, 25].map((km) => <Chip key={km} label={`${km} km`} selected={draft.radiusKm === km} onPress={() => update({ radiusKm: km })} />)}</View>
            {!canContinue ? <Body muted>Choose an area or use your device location to continue.</Body> : null}
          </>
        ) : null}

        {step === 3 ? (
          <>
            <View style={styles.stepHeader}>
              <Eyebrow>Payment</Eyebrow>
              <Title>Seal it with a payment.</Title>
              <Body muted>Complete the mock payment to secure your mystery table. No real charge is made in this demo.</Body>
            </View>
            <Card style={styles.paymentSummary}>
              <View style={styles.summaryRow}><Body>Reservation service fee</Body><Text style={styles.struck}>AED 0</Text></View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}><Body>Mock payment total</Body><Text style={styles.summaryTotal}>AED {draft.totalBudget}</Text></View>
              <View style={styles.summaryRow}><Body muted>Reservation budget for {draft.partySize}</Body><Body muted>AED {draft.totalBudget}</Body></View>
            </Card>
            <View style={styles.paymentMethods}>{PAYMENT_METHODS.map(({ id, label, Icon }) => { const selected = draft.paymentMethod === id; return <Pressable key={id} accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={() => update({ paymentMethod: id })} style={[styles.paymentMethod, selected && styles.paymentMethodSelected]}><Icon color={selected ? colors.gold : colors.textSoft} size={24} strokeWidth={1.7} /><Text style={styles.paymentLabel}>{label}</Text>{selected ? <View style={styles.paymentCheck}><Check size={12} color={colors.primaryText} strokeWidth={3} /></View> : null}</Pressable>; })}</View>
            <View style={styles.demoNote}><LockKeyhole size={16} color={colors.warning} /><Body muted>Demo checkout — nothing is charged.</Body></View>
            {!user ? <Card style={styles.accountNote}><Text style={styles.accountTitle}>Create your account to pay</Text><Body muted>You can plan the whole mystery as a guest. We’ll ask you to register only when you’re ready to seal the reservation.</Body></Card> : null}
            <Card style={styles.envelopePromise}><Text style={styles.envelopePromiseTitle}>✉️ Your sealed reveal</Text><Body muted>After payment, the restaurant and menu go into a sealed envelope. It opens with an animation exactly at your confirmed reservation time.</Body></Card>
            {error ? <InlineError message={error} /> : null}
            <Button disabled={!draft.paymentMethod} loading={submitting} onPress={() => void confirm()}>{draft.paymentMethod ? (user ? `Pay AED ${draft.totalBudget} & seal envelope` : 'Create account to continue') : 'Choose how to pay'}</Button>
          </>
        ) : null}
      </ScrollView>
      {step < STEPS.length - 1 ? <View style={styles.footer}><Button disabled={!canContinue} onPress={next}>Next →</Button></View> : null}
      <AppTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  top: { height: 56, paddingHorizontal: spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  progressCopy: { alignItems: 'center', gap: 1 },
  progressStep: { color: colors.goldSoft, fontSize: 10, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase' },
  progress: { color: colors.text, fontSize: 14, fontWeight: '700' },
  progressTrack: { height: 3, marginHorizontal: 20, borderRadius: 2, backgroundColor: colors.line },
  progressFill: { height: 3, borderRadius: 2, backgroundColor: colors.gold },
  content: { paddingHorizontal: 20, paddingTop: spacing.lg, paddingBottom: 210, gap: 14 },
  stepHeader: { gap: 6, marginBottom: 4 },
  footer: { position: 'absolute', bottom: 76, left: 0, right: 0, alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 12, paddingBottom: spacing.md, backgroundColor: '#0E0C0D', borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  disabled: { opacity: 0.35 },
  mutedText: { color: colors.muted },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: spacing.sm, backgroundColor: colors.border },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  fieldHint: { color: colors.goldSoft, fontSize: 12.5, fontWeight: '600', marginTop: spacing.xs },
  peopleCounter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xl, paddingVertical: spacing.md },
  counterButton: { width: 48, height: 48, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.selectedBorder, alignItems: 'center', justifyContent: 'center' },
  peopleValue: { minWidth: 110, alignItems: 'center' },
  count: { color: colors.text, fontSize: 52, lineHeight: 56, fontWeight: '800', letterSpacing: -1.5 },
  peopleLabel: { color: colors.muted, fontSize: 13 },
  peopleEmoji: { marginTop: spacing.sm, fontSize: 16 },
  quickDates: { gap: spacing.sm },
  dateChip: { minWidth: 80, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, borderRadius: radius.md, alignItems: 'center' },
  dateChipSelected: { borderColor: colors.accentBorder, backgroundColor: colors.accentSurface },
  dateLabel: { color: colors.textSoft, fontSize: 13, fontWeight: '700' },
  dateValue: { color: colors.muted, fontSize: 11.5, marginTop: 2 },
  selectedText: { color: colors.text },
  datePicker: { minHeight: 50, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, borderRadius: radius.sm, paddingHorizontal: 12, alignItems: 'flex-start', justifyContent: 'center' },
  timeHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: spacing.sm },
  sliderLabelRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: spacing.sm },
  sliderTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  sliderValue: { color: colors.gold, fontSize: 16, fontWeight: '800' },
  mealBadge: { alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: '#2A1A14', borderWidth: 1, borderColor: colors.accentBorder },
  mealBadgeText: { color: colors.gold, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  railTouch: { height: 44, justifyContent: 'center', marginHorizontal: 4 },
  rail: { height: 6, borderRadius: 3, backgroundColor: '#211C1D' },
  railFill: { position: 'absolute', left: 0, height: 6, borderRadius: 3, backgroundColor: colors.red },
  railDot: { position: 'absolute', width: 28, height: 28, marginLeft: -14, borderRadius: 14, backgroundColor: colors.text, borderWidth: 3, borderColor: colors.red, shadowColor: colors.red, shadowOpacity: 0.45, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } },
  railLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  distanceLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -spacing.sm },
  railLabel: { color: colors.faint, fontSize: 11 },
  tipBubble: { borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: '#1D1512', borderWidth: 1, borderColor: '#33261C' },
  tipText: { color: colors.textSoft, textAlign: 'center', fontSize: 13, lineHeight: 19, fontWeight: '600', fontStyle: 'italic' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chipsCentered: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm },
  chip: { minHeight: 38, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, justifyContent: 'center', paddingHorizontal: 14 },
  chipSelected: { borderColor: colors.accentBorder, backgroundColor: colors.accentSurface },
  chipText: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  chipTextSelected: { color: colors.text, fontWeight: '700' },
  segmented: { flexDirection: 'row', gap: 4, padding: 5, borderRadius: radius.pill, backgroundColor: colors.surfaceSunken, borderWidth: 1, borderColor: '#2A2527' },
  segment: { flex: 1, minHeight: 40, paddingHorizontal: spacing.sm, borderRadius: radius.pill, borderWidth: 1, borderColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
  segmentSelected: { backgroundColor: colors.selected, borderColor: colors.selectedBorder },
  segmentText: { color: colors.textSoft, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  allergyToggle: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: 14 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { borderColor: colors.gold, backgroundColor: colors.gold },
  allergyText: { color: colors.text, fontWeight: '600', fontSize: 14 },
  areaSelect: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, borderRadius: radius.sm, paddingHorizontal: 14 },
  areaSelectText: { flex: 1, color: colors.text, fontSize: 15, marginRight: spacing.sm },
  areaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  orLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  orText: { color: colors.faint, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  paymentSummary: { paddingVertical: 14, gap: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  summaryDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  struck: { color: colors.muted, fontSize: 13.5, textDecorationLine: 'line-through' },
  summaryTotal: { color: colors.text, fontSize: 18, fontWeight: '800' },
  paymentMethods: { flexDirection: 'row', gap: spacing.sm },
  paymentMethod: { flex: 1, minHeight: 96, alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.sm },
  paymentMethodSelected: { borderColor: colors.accentBorder, backgroundColor: colors.accentSurface },
  paymentLabel: { color: colors.text, fontSize: 12.5, fontWeight: '700', textAlign: 'center' },
  paymentCheck: { position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.gold },
  demoNote: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  envelopePromise: { backgroundColor: colors.backgroundSecondary, borderColor: '#2A1A22' },
  envelopePromiseTitle: { color: colors.text, fontWeight: '700', fontSize: 15 },
  accountNote: { backgroundColor: colors.accentSurface, borderColor: colors.accentBorder },
  accountTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
});
