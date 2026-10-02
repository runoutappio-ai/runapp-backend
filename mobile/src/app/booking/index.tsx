import { useEffect, useMemo, useRef, useState } from 'react';
import {
  type AccessibilityActionEvent,
  type GestureResponderEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/auth/AuthProvider';
import { api } from '@/api/client';
import { queryClient } from '@/api/query';
import { Button, Field, InlineError } from '@/components/ui';
import { AmbientBackground, GlassSurface, useGlassBar, useGlassPill } from '@/components/Glass';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { useBookingDraft } from '@/features/booking/BookingDraftProvider';
import { locationPatch } from '@/features/booking/location';
import { CUISINES, DIETARY, DUBAI_AREAS, VIBES, dubaiIso, randomBudgetLine, randomVibeLine, toReservationPayload } from '@/features/booking/model';
import { scheduleReservationReminders } from '@/features/booking/notifications';
import { mockPaymentProvider, requireCapturedPayment } from '@/features/booking/payment';
import { createReservation, payReservation, reservationKeys } from '@/features/reservations/api';
import { colors, radius } from '@/theme/tokens';
import type { LocationCandidate } from '@/types/api';
import { useTheme } from '@/theme/ThemeProvider';

/** Three steps: table & place → budget & mood → payment. */
const STEPS = ['Your table & place', 'Budget & mood', 'Payment'];
const DISTANCES = [1, 3, 5, 10, 25] as const;
const PER_PERSON_MIN = 50;
const PER_PERSON_MAX = 400;
const ANYWHERE = { locationLabel: 'Anywhere in Dubai', latitude: 25.2048, longitude: 55.2708, radiusKm: 25 };
const PAYMENT_METHODS = [
  { id: 'card', label: 'Card', Icon: CreditCard },
  { id: 'apple-pay', label: 'Apple Pay', Icon: Smartphone },
  { id: 'google-pay', label: 'Google Pay', Icon: WalletCards },
] as const;

function dateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function displayDate(date: Date) {
  return new Intl.DateTimeFormat('en-AE', { day: 'numeric', month: 'short' }).format(date);
}
function timeString(totalMinutes: number) {
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
}
function endTime(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return timeString(Math.min(23 * 60, hours * 60 + minutes + 60));
}

/** Glass pill; gold when selected. */
function Chip({ label, selected, onPress, disabled, small }: { label: string; selected: boolean; onPress: () => void; disabled?: boolean; small?: boolean }) {
  const { colors: themeColors } = useTheme();
  const glassPill = useGlassPill();
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: selected, disabled }} disabled={disabled} onPress={onPress} style={[styles.chip, small && styles.chipSmall, glassPill, selected && { backgroundColor: themeColors.glassPick, borderColor: themeColors.glassPickBorder }, disabled && styles.dim]}>
      <Text style={[styles.chipText, small && styles.chipTextSmall, { color: themeColors.glassText }, selected && { color: themeColors.text, fontWeight: '800' }]}>{label}</Text>
    </Pressable>
  );
}

function Checkbox({ checked }: { checked: boolean }) {
  const { colors: themeColors } = useTheme();
  return <View style={[styles.checkbox, { borderColor: themeColors.glassPickBorder, backgroundColor: checked ? themeColors.gold : themeColors.glassPick }]}>{checked ? <Check size={13} color={themeColors.primaryText} strokeWidth={3} /> : null}</View>;
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
  const { colors: themeColors } = useTheme();
  const railRef = useRef<View>(null);
  const bounds = useRef({ left: 0, width: 1 });
  const clamped = Math.min(maximum, Math.max(minimum, value));
  const position = ((clamped - minimum) / Math.max(1, maximum - minimum)) * 100;
  // Track where the rail sits on screen so a tap or drag anywhere maps to a value.
  // On web we read the DOM rect (correct even when the demo phone frame is scaled).
  const measureRail = () => {
    const node = railRef.current as unknown as { getBoundingClientRect?: () => DOMRect } | null;
    if (Platform.OS === 'web' && node?.getBoundingClientRect) {
      const rect = node.getBoundingClientRect();
      bounds.current = { left: rect.left + (typeof window !== 'undefined' ? window.scrollX : 0), width: Math.max(1, rect.width) };
      return;
    }
    railRef.current?.measure((_x, _y, width, _height, pageX) => { bounds.current = { left: pageX, width: Math.max(1, width) }; });
  };
  const updateFromPageX = (pageX: number) => {
    const { left, width } = bounds.current;
    const ratio = Math.max(0, Math.min(1, (pageX - left) / width));
    const next = Math.min(maximum, Math.max(minimum, Math.round((minimum + ratio * (maximum - minimum)) / step) * step));
    if (next !== clamped) onChange(next);
  };
  const onAccessibilityAction = (event: AccessibilityActionEvent) => {
    const delta = event.nativeEvent.actionName === 'increment' ? step : -step;
    onChange(Math.min(maximum, Math.max(minimum, clamped + delta)));
  };
  return (
    <View
      ref={railRef}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min: minimum, max: maximum, now: clamped }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={onAccessibilityAction}
      onLayout={measureRail}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={(event: GestureResponderEvent) => { measureRail(); updateFromPageX(event.nativeEvent.pageX); }}
      onResponderMove={(event: GestureResponderEvent) => updateFromPageX(event.nativeEvent.pageX)}
      style={[styles.railTouch, Platform.OS === 'web' && styles.railWeb]}>
      <View pointerEvents="none" style={[styles.rail, { backgroundColor: themeColors.glassActive }]} />
      <View pointerEvents="none" style={[styles.railFill, { width: `${position}%`, backgroundColor: themeColors.gold }]} />
      <View pointerEvents="none" style={[styles.railDot, { left: `${position}%`, borderColor: themeColors.gold }]} />
    </View>
  );
}

export default function BookingScreen() {
  const { user } = useAuth();
  const { colors: themeColors } = useTheme();
  const insets = useSafeAreaInsets();
  const glassPill = useGlassPill();
  const glassBar = useGlassBar();
  const { draft, update, reset } = useBookingDraft();
  const { vibe: vibeParam } = useLocalSearchParams<{ vibe?: string }>();
  const [vibeLine, setVibeLine] = useState(() => randomVibeLine(draft.vibe));
  const pickVibe = (vibe: string) => { update({ vibe }); setVibeLine((current) => randomVibeLine(vibe, current)); };
  // Discover links here with ?vibe=…: preselect that mood once.
  useEffect(() => {
    const match = VIBES.find((item) => item === vibeParam);
    if (match) { update({ vibe: match }); setVibeLine(randomVibeLine(match)); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vibeParam]);
  const hasLocation = Boolean(draft.locationLabel && draft.latitude != null && draft.longitude != null);
  // Drafts saved by the old 4-step flow may point past the table step without a location: send them back to step 1.
  const step = draft.step > 0 && !hasLocation ? 0 : Math.min(draft.step, STEPS.length - 1);
  const [error, setError] = useState('');
  const [locationStatus, setLocationStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showAreas, setShowAreas] = useState(false);
  const [pickingTastes, setPickingTastes] = useState(draft.excludedCuisineTypes.length > 0);
  const [dietaryOpen, setDietaryOpen] = useState(draft.dietaryPreferences.length > 0 || Boolean(draft.allergyNotes));
  const [now] = useState(() => Date.now());
  const today = useMemo(() => { const date = new Date(); date.setHours(0, 0, 0, 0); return date; }, []);
  const quickDates = useMemo(() => Array.from({ length: 6 }, (_, index) => { const date = new Date(today); date.setDate(today.getDate() + index); return date; }), [today]);
  const effectiveDate = draft.date || dateString(quickDates[1]);
  const selectedDate = new Date(`${effectiveDate}T12:00:00`);
  const [selectedHours, selectedMinutes] = draft.time.split(':').map(Number);
  const timeMinutes = Math.min(22 * 60, Math.max(7 * 60, selectedHours * 60 + selectedMinutes));
  // The budget is chosen per person (AED 50–400 in steps of 50); the table total follows the party size.
  const perPerson = Math.min(PER_PERSON_MAX, Math.max(PER_PERSON_MIN, Math.round(draft.totalBudget / draft.partySize / 50) * 50));
  const setPartySize = (partySize: number) => update({ partySize, totalBudget: perPerson * partySize });
  const [budgetLine, setBudgetLine] = useState(() => randomBudgetLine(perPerson));
  // AED 50–100 a person plus a licensed venue: a cheeky reality check.
  const [boozePopup, setBoozePopup] = useState(false);
  const setPerPerson = (value: number) => {
    if (value === perPerson) return;
    update({ totalBudget: value * draft.partySize });
    setBudgetLine(randomBudgetLine(value));
    if (draft.licensedVenue && value <= 100 && perPerson > 100) setBoozePopup(true);
  };
  const toggleLicensed = () => {
    const next = !draft.licensedVenue;
    update({ licensedVenue: next });
    if (next && perPerson <= 100) setBoozePopup(true);
  };
  // Older drafts stored a free table total: snap it to the per-person scale once.
  useEffect(() => {
    if (draft.totalBudget !== perPerson * draft.partySize) update({ totalBudget: perPerson * draft.partySize });
  }, [draft.partySize, draft.totalBudget, perPerson, update]);

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
  const toggleAnywhere = () => {
    setShowAreas(false);
    update(draft.anywhere ? { anywhere: false, locationLabel: '', latitude: null, longitude: null, radiusKm: 5 } : { anywhere: true, ...ANYWHERE });
    void Haptics.selectionAsync();
  };
  const selectArea = async (area: (typeof DUBAI_AREAS)[number]) => {
    update({ anywhere: false, locationLabel: `${area.name}, Dubai, United Arab Emirates`, latitude: area.latitude, longitude: area.longitude });
    setLocationStatus('');
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
      update({ anywhere: false, ...locationPatch(candidate) });
      setLocationStatus('');
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
    ? reservationInFuture && hasLocation
    : step === 1
      ? draft.totalBudget === perPerson * draft.partySize
      : Boolean(draft.paymentMethod);
  const muted = { color: themeColors.glassText };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]} edges={['top', 'left', 'right']}>
      <AmbientBackground />
      <View style={styles.top}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={back} style={[styles.topButton, glassPill]}><ChevronLeft color={themeColors.text} size={20} /></Pressable>
        <View style={styles.progressCopy}><Text style={[styles.progressStep, { color: themeColors.goldSoft }]}>Step {step + 1} of {STEPS.length}</Text><Text style={[styles.progress, { color: themeColors.text }]}>{STEPS[step]}</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Close booking" onPress={() => router.replace('/')} style={[styles.topButton, glassPill]}><X color={themeColors.text} size={18} /></Pressable>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: themeColors.glassActive }]}><View style={[styles.progressFill, { width: `${((step + 1) / STEPS.length) * 100}%`, backgroundColor: themeColors.gold }]} /></View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 110 + insets.bottom }]} keyboardShouldPersistTaps="handled">
        {step === 0 ? (
          <>
            <View style={styles.stepHeader}>
              <Text style={[styles.title, { color: themeColors.text }]}>Who, when and where?</Text>
              <Text style={[styles.subtitle, muted]}>Tables for two to six.</Text>
            </View>

            <GlassSurface radius={18} style={styles.peopleCard}>
              <Pressable accessibilityRole="button" accessibilityLabel="Remove one guest" disabled={draft.partySize <= 2} onPress={() => setPartySize(draft.partySize - 1)} style={[styles.counterButton, glassPill, draft.partySize <= 2 && styles.dim]}><Minus color={themeColors.gold} size={17} /></Pressable>
              <View style={styles.peopleValue}><Text style={[styles.count, { color: themeColors.text }]}>{draft.partySize}</Text><Text style={[styles.peopleLabel, muted]}>people</Text></View>
              <Pressable accessibilityRole="button" accessibilityLabel="Add one guest" disabled={draft.partySize >= 6} onPress={() => setPartySize(draft.partySize + 1)} style={[styles.counterButton, glassPill, draft.partySize >= 6 && styles.dim]}><Plus color={themeColors.gold} size={17} /></Pressable>
            </GlassSurface>

            <GlassSurface radius={18} style={styles.card}>
              <Text style={[styles.cardLabel, { color: themeColors.goldSoft }]}>When?</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickDates}>
                {quickDates.map((date, index) => {
                  const selected = effectiveDate === dateString(date);
                  const label = index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : new Intl.DateTimeFormat('en-AE', { weekday: 'short' }).format(date);
                  return (
                    <Pressable key={date.toISOString()} accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={() => update({ date: dateString(date) })} style={[styles.dateChip, glassPill, selected && { backgroundColor: themeColors.glassPick, borderColor: themeColors.glassPickBorder }]}>
                      <Text style={[styles.dateLabel, { color: selected ? themeColors.text : themeColors.textSoft }, selected && styles.bold]}>{label}</Text>
                      <Text style={[styles.dateValue, muted]}>{displayDate(date)}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              {Platform.OS === 'web' ? null : (
                <View style={styles.pickerRow}><Text style={[styles.smallLabel, muted]}>Another date</Text><DateTimePicker value={selectedDate} minimumDate={today} mode="date" display="compact" themeVariant="dark" onValueChange={(_, date) => update({ date: dateString(date) })} /></View>
              )}
              <View style={styles.timeRow}>
                <Text style={[styles.timeValue, { color: themeColors.text }]}>{draft.time} – {endTime(draft.time)}</Text>
                <View style={[styles.mealBadge, { borderColor: themeColors.glassPickBorder }]}><Text style={[styles.mealBadgeText, { color: themeColors.gold }]}>{timeMinutes < 11 * 60 ? 'BREAKFAST' : timeMinutes < 16 * 60 ? 'LUNCH' : 'DINNER'}</Text></View>
              </View>
              <DiscreteRail value={timeMinutes} minimum={7 * 60} maximum={22 * 60} step={15} label="Reservation start time" onChange={(value) => update({ time: timeString(value) })} />
              <View style={styles.railLabels}>{['07:00', '11:00', '15:00', '19:00', '23:00'].map((l) => <Text key={l} style={[styles.railLabel, muted]}>{l}</Text>)}</View>
              {!reservationInFuture ? <Text style={[styles.warn, { color: themeColors.danger }]}>Choose a future time in Dubai.</Text> : null}
            </GlassSurface>

            <GlassSurface radius={18} style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={[styles.cardLabel, { color: themeColors.goldSoft }]}>Where?</Text>
                <Pressable accessibilityRole="button" onPress={() => void locateDevice()} disabled={draft.anywhere} style={[styles.smallPill, glassPill, draft.anywhere && styles.dim]}><LocateFixed color={themeColors.gold} size={12} /><Text style={[styles.smallPillText, { color: themeColors.text }]}>Use my location</Text></Pressable>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Choose your area in Dubai" disabled={draft.anywhere} onPress={() => setShowAreas((current) => !current)} style={[styles.areaSelect, { backgroundColor: themeColors.glassTrack, borderColor: themeColors.glassBorder }, draft.anywhere && styles.dim]}>
                <View style={styles.areaLeft}><MapPin color={themeColors.gold} size={13} /><Text numberOfLines={1} style={[styles.areaText, { color: draft.locationLabel && !draft.anywhere ? themeColors.text : themeColors.glassText }]}>{draft.anywhere ? 'Anywhere in Dubai' : draft.locationLabel ? draft.locationLabel.replace(', United Arab Emirates', '') : 'Choose your area'}</Text></View>
                <ChevronDown color={themeColors.glassText} size={16} />
              </Pressable>
              {showAreas && !draft.anywhere ? <View style={styles.chips}>{DUBAI_AREAS.map((area) => <Chip key={area.name} small label={area.name} selected={draft.locationLabel.startsWith(area.name)} onPress={() => void selectArea(area)} />)}</View> : null}
              {locationStatus ? <Text style={[styles.smallLabel, muted]}>{locationStatus}</Text> : null}
              <View style={[styles.rowBetween, draft.anywhere && styles.dim]}>
                <Text style={[styles.smallLabel, muted]}>Travel up to</Text>
                <View style={styles.distances}>{DISTANCES.map((km) => <Chip key={km} small label={`${km} km`} disabled={draft.anywhere} selected={!draft.anywhere && draft.radiusKm === km} onPress={() => update({ radiusKm: km })} />)}</View>
              </View>
              <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: draft.anywhere }} onPress={toggleAnywhere} style={[styles.anywhereRow, { borderTopColor: themeColors.glassDivider }]}>
                <Checkbox checked={draft.anywhere} />
                <View style={styles.anywhereCopy}>
                  <Text style={[styles.anywhereTitle, { color: themeColors.text }]}>Take me wherever you want!</Text>
                  <Text style={[styles.anywhereSub, muted]}>{draft.anywhere ? 'This is the attitude. We won’t disappoint you.' : 'No distance limit — anywhere in Dubai.'}</Text>
                </View>
              </Pressable>
            </GlassSurface>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <View style={styles.stepHeader}>
              <Text style={[styles.title, { color: themeColors.text }]}>How much, and what mood?</Text>
              <Text style={[styles.subtitle, muted]}>Per person · AED 50 to 400, in steps of 50</Text>
            </View>

            <GlassSurface radius={18} style={styles.card}>
              <View style={styles.rowBaseline}><Text style={[styles.cardLabel, { color: themeColors.goldSoft }]}>Budget per person</Text><Text style={[styles.budgetValue, { color: themeColors.text }]}>AED {perPerson}<Text style={[styles.budgetUnit, muted]}> / person</Text></Text></View>
              <DiscreteRail value={perPerson} minimum={PER_PERSON_MIN} maximum={PER_PERSON_MAX} step={50} label="Budget per person" onChange={setPerPerson} />
              <View style={styles.railLabels}><Text style={[styles.railLabel, muted]}>AED {PER_PERSON_MIN}</Text><Text style={[styles.railLabel, muted]}>per person</Text><Text style={[styles.railLabel, muted]}>AED {PER_PERSON_MAX}</Text></View>
              <View style={[styles.totalRow, { borderColor: themeColors.glassDivider }]}>
                <Text style={[styles.totalLabel, muted]}>Table total · {draft.partySize} people × AED {perPerson}</Text>
                <Text style={[styles.totalValue, { color: themeColors.gold }]}>AED {draft.totalBudget}</Text>
              </View>
              <View style={[styles.tip, { backgroundColor: themeColors.glassPick, borderColor: 'rgba(235, 196, 108, 0.25)' }]}><Text accessibilityLiveRegion="polite" style={[styles.tipText, { color: themeColors.textSoft }]}>{budgetLine}</Text></View>
            </GlassSurface>

            <GlassSurface radius={18} style={styles.card}>
              <Text style={[styles.cardLabel, { color: themeColors.goldSoft }]}>Outing vibe</Text>
              <View style={styles.chips}>{VIBES.map((vibe) => <Chip key={vibe} label={vibe} selected={draft.vibe === vibe} onPress={() => pickVibe(vibe)} />)}</View>
              <View style={[styles.tip, { backgroundColor: themeColors.glassPick, borderColor: 'rgba(235, 196, 108, 0.25)' }]}><Text accessibilityLiveRegion="polite" style={[styles.tipText, { color: themeColors.textSoft }]}>{vibeLine}</Text></View>
              <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: Boolean(draft.licensedVenue) }} onPress={toggleLicensed} style={[styles.anywhereRow, { borderTopColor: themeColors.glassDivider }]}>
                <Checkbox checked={Boolean(draft.licensedVenue)} />
                <View style={styles.anywhereCopy}>
                  <Text style={[styles.anywhereTitle, { color: themeColors.text }]}>Licensed venue (serves alcohol)</Text>
                  <Text style={[styles.anywhereSub, muted]}>{draft.licensedVenue ? 'Noted. Everyone at the table must be 21+ — bring ID.' : 'Only restaurants licensed to serve alcohol · 21+'}</Text>
                </View>
              </Pressable>
            </GlassSurface>

            <GlassSurface radius={18} style={styles.card}>
              <Text style={[styles.cardLabel, { color: themeColors.goldSoft }]}>Anything to rule out tonight?</Text>
              <View style={[styles.segmented, glassPill]}>
                <Pressable onPress={() => { setPickingTastes(false); update({ excludedCuisineTypes: [] }); }} style={[styles.segment, !pickingTastes && { backgroundColor: themeColors.glassActive, borderColor: themeColors.glassActiveBorder }]}><Text style={[styles.segmentText, { color: !pickingTastes ? themeColors.text : themeColors.glassText }]}>Open to anything</Text></Pressable>
                <Pressable onPress={() => setPickingTastes(true)} style={[styles.segment, pickingTastes && { backgroundColor: themeColors.glassActive, borderColor: themeColors.glassActiveBorder }]}><Text style={[styles.segmentText, { color: pickingTastes ? themeColors.text : themeColors.glassText }]}>Let me pick</Text></Pressable>
              </View>
              {pickingTastes ? <><View style={styles.chips}>{CUISINES.map((cuisine) => <Chip key={cuisine} small label={cuisine} selected={draft.excludedCuisineTypes.includes(cuisine)} onPress={() => toggle('excludedCuisineTypes', cuisine, 3)} />)}</View><Text style={[styles.smallLabel, muted]}>{draft.excludedCuisineTypes.length}/3 excluded</Text></> : null}
              <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: dietaryOpen }} onPress={() => { setDietaryOpen((current) => !current); if (dietaryOpen) update({ dietaryPreferences: [], allergyNotes: '' }); }} style={[styles.anywhereRow, { borderTopColor: themeColors.glassDivider }]}>
                <Checkbox checked={dietaryOpen} />
                <Text style={[styles.anywhereTitle, { color: themeColors.text }]}>Allergies or dietary conditions?</Text>
              </Pressable>
              {dietaryOpen ? <><View style={styles.chips}>{DIETARY.map((diet) => <Chip key={diet} small label={diet} selected={draft.dietaryPreferences.includes(diet)} onPress={() => toggle('dietaryPreferences', diet)} />)}</View><Field label="Allergy notes" value={draft.allergyNotes} onChangeText={(allergyNotes) => update({ allergyNotes })} multiline maxLength={500} placeholder="Tell us what the restaurant needs to know" /></> : null}
            </GlassSurface>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <View style={styles.stepHeader}>
              <Text style={[styles.title, { color: themeColors.text }]}>Seal it with a payment.</Text>
              <Text style={[styles.subtitle, muted]}>Demo checkout — nothing is charged.</Text>
            </View>

            <GlassSurface radius={18} style={styles.card}>
              <View style={styles.rowBetween}><Text style={[styles.summaryText, muted]}>Reservation service fee</Text><Text style={[styles.struck, muted]}>AED 0</Text></View>
              <View style={[styles.hairline, { backgroundColor: themeColors.glassDivider }]} />
              <View style={styles.rowBetween}><Text style={[styles.summaryText, muted]}>Per person</Text><Text style={[styles.summaryText, { color: themeColors.text }]}>AED {perPerson} × {draft.partySize}</Text></View>
              <View style={styles.rowBaseline}><Text style={[styles.summaryTotalLabel, { color: themeColors.text }]}>Total</Text><Text style={[styles.summaryTotal, { color: themeColors.text }]}>AED {draft.totalBudget}</Text></View>
              <Text style={[styles.smallLabel, muted]}>Budget for your table of {draft.partySize}{draft.anywhere ? ' · anywhere in Dubai' : draft.locationLabel ? ` · near ${draft.locationLabel.split(',')[0]}` : ''}{draft.licensedVenue ? ' · licensed venue' : ''}</Text>
            </GlassSurface>

            <View style={styles.paymentMethods}>{PAYMENT_METHODS.map(({ id, label, Icon }) => { const selected = draft.paymentMethod === id; return (
              <Pressable key={id} accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={() => update({ paymentMethod: id })} style={[styles.paymentMethod, glassPill, selected && { backgroundColor: themeColors.glassPick, borderColor: themeColors.glassPickBorder }]}>
                <Icon color={selected ? themeColors.gold : themeColors.textSoft} size={22} strokeWidth={1.7} />
                <Text style={[styles.paymentLabel, { color: themeColors.text }]}>{label}</Text>
                {selected ? <View style={[styles.paymentCheck, { backgroundColor: themeColors.gold }]}><Check size={11} color={themeColors.primaryText} strokeWidth={3} /></View> : null}
              </Pressable>
            ); })}</View>

            {!user ? <GlassSurface radius={18} style={styles.card}><Text style={[styles.anywhereTitle, { color: themeColors.text }]}>Create your account to pay</Text><Text style={[styles.smallLabel, muted]}>Plan the whole mystery as a guest — we’ll only ask you to register when you’re ready to seal it.</Text></GlassSurface> : null}

            <GlassSurface radius={18} style={[styles.card, styles.promise]}>
              <View style={styles.miniEnvelope}><View style={styles.miniFlap} /><View style={styles.miniSeal} /></View>
              <Text style={[styles.promiseText, muted]}>After payment, the restaurant and menu go into a sealed envelope that opens at your reservation time.</Text>
            </GlassSurface>
            <View style={styles.demoNote}><LockKeyhole size={13} color={themeColors.gold} /><Text style={[styles.smallLabel, muted]}>Demo checkout — nothing is charged.</Text></View>
            {error ? <InlineError message={error} /> : null}
          </>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, glassBar, { paddingBottom: Math.max(insets.bottom, 14) + 8, borderTopColor: themeColors.glassDivider }]}>
        {step < STEPS.length - 1 ? (
          <View style={styles.footerActions}>
            <View style={styles.footerBack}><Button variant="secondary" onPress={back}>Back</Button></View>
            <View style={styles.footerNext}><Button disabled={!canContinue} onPress={next}>Next →</Button></View>
          </View>
        ) : (
          <Button disabled={!draft.paymentMethod} loading={submitting} onPress={() => void confirm()}>{draft.paymentMethod ? (user ? `Pay AED ${draft.totalBudget} & seal envelope` : 'Create account to continue') : 'Choose how to pay'}</Button>
        )}
      </View>
      {boozePopup ? (
        <View style={[StyleSheet.absoluteFill, styles.popupLayer]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" style={[StyleSheet.absoluteFill, styles.popupBackdrop]} onPress={() => setBoozePopup(false)} />
          <Animated.View entering={ZoomIn.springify().damping(14)} style={styles.popupWrap}>
            <GlassSurface radius={24} style={[styles.popup, { backgroundColor: themeColors.glassSolid }]}>
              <Text style={[styles.popupEyebrow, { color: themeColors.gold }]}>WAIT A SECOND</Text>
              <Text style={[styles.popupTitle, { color: themeColors.text }]}>AED {perPerson} a person… and alcohol??</Text>
              <Text style={[styles.popupBody, { color: themeColors.glassText }]}>We do everything for you, but we don’t do magic.</Text>
              <Button onPress={() => { setPerPerson(150); setBoozePopup(false); }}>Raise to AED 150 a person</Button>
              <Button variant="secondary" onPress={() => { update({ licensedVenue: false }); setBoozePopup(false); }}>Skip the drinks</Button>
            </GlassSurface>
          </Animated.View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  popupLayer: { justifyContent: 'center', alignItems: 'center', padding: 24, zIndex: 50 },
  popupBackdrop: { backgroundColor: 'rgba(6, 4, 5, 0.72)' },
  popupWrap: { width: '100%', maxWidth: 360 },
  popup: { padding: 20, gap: 10, alignItems: 'stretch' },
  popupEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 2, textAlign: 'center' },
  popupTitle: { fontSize: 20, lineHeight: 25, fontWeight: '800', letterSpacing: -0.3, textAlign: 'center' },
  popupBody: { fontSize: 14, lineHeight: 20, textAlign: 'center', fontStyle: 'italic', marginBottom: 6 },
  budgetUnit: { fontSize: 12, fontWeight: '600', letterSpacing: 0 },
  totalRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8, marginTop: 2 },
  totalLabel: { fontSize: 11.5, fontWeight: '600', flexShrink: 1 },
  totalValue: { fontSize: 16, fontWeight: '800' },
  safe: { flex: 1, backgroundColor: colors.background },
  top: { height: 52, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  progressCopy: { alignItems: 'center', gap: 1 },
  progressStep: { fontSize: 10, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase' },
  progress: { fontSize: 14, fontWeight: '700' },
  progressTrack: { height: 3, marginHorizontal: 20, marginTop: 4, borderRadius: 2 },
  progressFill: { height: 3, borderRadius: 2 },
  content: { paddingHorizontal: 16, paddingTop: 16, gap: 10 },
  stepHeader: { gap: 3, paddingHorizontal: 4, marginBottom: 2 },
  title: { fontSize: 19, lineHeight: 23, fontWeight: '800', letterSpacing: -0.3 },
  subtitle: { fontSize: 12, lineHeight: 16 },
  card: { padding: 12, gap: 10 },
  cardLabel: { fontSize: 12, fontWeight: '700' },
  smallLabel: { fontSize: 11.5, lineHeight: 16 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  rowBaseline: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  bold: { fontWeight: '800' },
  dim: { opacity: 0.4 },
  peopleCard: { paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  counterButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  peopleValue: { alignItems: 'center' },
  count: { fontSize: 30, lineHeight: 34, fontWeight: '800' },
  peopleLabel: { fontSize: 11 },
  quickDates: { gap: 6 },
  dateChip: { minWidth: 70, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 12, alignItems: 'center' },
  dateLabel: { fontSize: 11.5, fontWeight: '700' },
  dateValue: { fontSize: 10, marginTop: 1 },
  pickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  timeValue: { fontSize: 19, fontWeight: '800', letterSpacing: -0.4 },
  mealBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: radius.pill, borderWidth: 1 },
  mealBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 1.4 },
  railWeb: { cursor: 'pointer', userSelect: 'none', touchAction: 'none' } as object,
  railTouch: { height: 30, justifyContent: 'center', marginHorizontal: 4 },
  rail: { height: 6, borderRadius: 3 },
  railFill: { position: 'absolute', left: 0, height: 6, borderRadius: 3 },
  railDot: { position: 'absolute', width: 20, height: 20, marginLeft: -10, borderRadius: 10, backgroundColor: '#FFFFFF', borderWidth: 3 },
  railLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -4 },
  railLabel: { fontSize: 9.5 },
  warn: { fontSize: 12, fontWeight: '600' },
  smallPill: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 26, paddingHorizontal: 10, borderRadius: radius.pill },
  smallPillText: { fontSize: 11, fontWeight: '700' },
  areaSelect: { height: 40, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  areaLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
  areaText: { flex: 1, fontSize: 13, fontWeight: '600' },
  distances: { flexDirection: 'row', gap: 5 },
  anywhereRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  anywhereCopy: { flex: 1, gap: 1 },
  anywhereTitle: { fontSize: 13, fontWeight: '700' },
  anywhereSub: { fontSize: 11 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { height: 30, borderRadius: radius.pill, justifyContent: 'center', paddingHorizontal: 12 },
  chipSmall: { height: 26, paddingHorizontal: 9 },
  chipText: { fontSize: 12, fontWeight: '600' },
  chipTextSmall: { fontSize: 11 },
  budgetValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  tip: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1 },
  tipText: { fontSize: 11.5, fontStyle: 'italic', textAlign: 'center' },
  segmented: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: radius.pill },
  segment: { flex: 1, height: 30, borderRadius: radius.pill, borderWidth: 1, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  segmentText: { fontSize: 11.5, fontWeight: '700' },
  summaryText: { fontSize: 13 },
  struck: { fontSize: 13, textDecorationLine: 'line-through' },
  hairline: { height: StyleSheet.hairlineWidth },
  summaryTotalLabel: { fontSize: 14, fontWeight: '700' },
  summaryTotal: { fontSize: 22, fontWeight: '800' },
  paymentMethods: { flexDirection: 'row', gap: 8 },
  paymentMethod: { flex: 1, height: 88, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 8 },
  paymentLabel: { fontSize: 12, fontWeight: '700' },
  paymentCheck: { position: 'absolute', top: 8, right: 8, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  promise: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  miniEnvelope: { width: 70, height: 46, borderRadius: 5, backgroundColor: '#F4EBD8', overflow: 'hidden' },
  miniFlap: { position: 'absolute', top: 0, left: 0, width: 0, height: 0, borderLeftWidth: 35, borderRightWidth: 35, borderTopWidth: 18, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#EADCBE' },
  miniSeal: { position: 'absolute', top: 12, left: 29, width: 12, height: 12, borderRadius: 6, backgroundColor: '#7A2842' },
  promiseText: { flex: 1, fontSize: 12, lineHeight: 17 },
  demoNote: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  footerActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  footerBack: { minWidth: 96 },
  footerNext: { minWidth: 142 },
});
