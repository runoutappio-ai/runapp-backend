import type { CreateReservationPayload, ReservationStatus } from '@/types/api';

export const VIBES = ['Casual', 'Date Night', 'Extreme', 'Birthday', 'Dress to Impress'] as const;
export const CUISINES = ['American', 'BBQ', 'Chinese', 'French', 'Greek', 'Indian', 'Italian', 'Japanese', 'Korean', 'Mediterranean', 'Mexican', 'Middle Eastern', 'Seafood', 'Steakhouse', 'Thai', 'Vegan'] as const;
export const DIETARY = ['Vegetarian', 'Vegan', 'Halal', 'Gluten-free', 'Dairy-free', 'Nut-free'] as const;

export const DUBAI_AREAS = [
  { name: 'Downtown Dubai', latitude: 25.1972, longitude: 55.2744 },
  { name: 'Business Bay', latitude: 25.186, longitude: 55.263 },
  { name: 'DIFC', latitude: 25.2118, longitude: 55.2796 },
  { name: 'Dubai Marina', latitude: 25.0805, longitude: 55.1403 },
  { name: 'JBR', latitude: 25.078, longitude: 55.133 },
  { name: 'Palm Jumeirah', latitude: 25.1124, longitude: 55.139 },
  { name: 'Jumeirah', latitude: 25.2048, longitude: 55.24 },
  { name: 'Dubai Hills', latitude: 25.112, longitude: 55.246 },
  { name: 'JVC', latitude: 25.056, longitude: 55.209 },
  { name: 'Al Barsha', latitude: 25.11, longitude: 55.2 },
  { name: 'Deira', latitude: 25.2697, longitude: 55.3095 },
  { name: 'Bur Dubai', latitude: 25.26, longitude: 55.297 },
  { name: 'Dubai Creek', latitude: 25.197, longitude: 55.36 },
  { name: 'City Walk', latitude: 25.207, longitude: 55.262 },
  { name: 'Bluewaters Island', latitude: 25.079, longitude: 55.122 },
] as const;

export type BookingDraft = {
  step: number;
  partySize: number;
  date: string;
  time: string;
  totalBudget: number;
  vibe: string;
  excludedCuisineTypes: string[];
  dietaryPreferences: string[];
  allergyNotes: string;
  anywhere: boolean;
  locationLabel: string;
  latitude: number | null;
  longitude: number | null;
  radiusKm: number;
  paymentMethod: 'card' | 'apple-pay' | 'google-pay' | null;
  reservationId: string | null;
  createIdempotencyKey: string | null;
  paymentIdempotencyKey: string | null;
};

export const initialDraft: BookingDraft = {
  step: 0,
  partySize: 2,
  date: '',
  time: '19:30',
  totalBudget: 200,
  vibe: 'Casual',
  excludedCuisineTypes: [],
  dietaryPreferences: [],
  allergyNotes: '',
  anywhere: false,
  locationLabel: '',
  latitude: null,
  longitude: null,
  radiusKm: 5,
  paymentMethod: null,
  reservationId: null,
  createIdempotencyKey: null,
  paymentIdempotencyKey: null,
};

export function dubaiIso(date: string, time: string) {
  return `${date}T${time}:00+04:00`;
}

export function kilometresToMetres(kilometres: number) {
  return Math.round(kilometres * 1000);
}

export function toReservationPayload(draft: BookingDraft): CreateReservationPayload {
  if (!draft.date || draft.latitude == null || draft.longitude == null || !draft.locationLabel) {
    throw new Error('Date and location are required.');
  }
  const reservationAt = dubaiIso(draft.date, draft.time);
  const instant = new Date(reservationAt);
  const totalBudget = Math.round(draft.totalBudget * 100) / 100;
  return {
    reservationAt,
    timeWindowStartAt: new Date(instant.getTime() - 30 * 60_000).toISOString(),
    timeWindowEndAt: new Date(instant.getTime() + 30 * 60_000).toISOString(),
    excludedCuisineTypes: draft.excludedCuisineTypes.slice(0, 3),
    vibe: draft.vibe,
    dietaryPreferences: draft.dietaryPreferences,
    allergyNotes: draft.allergyNotes.trim() || null,
    locationLabel: draft.locationLabel,
    partySize: draft.partySize,
    budgetPerPerson: { amount: Math.round((totalBudget / draft.partySize) * 100) / 100, currency: 'AED' },
    totalBudget: { amount: totalBudget, currency: 'AED' },
    searchArea: {
      latitude: draft.latitude,
      longitude: draft.longitude,
      radiusMeters: kilometresToMetres(draft.radiusKm),
    },
  };
}

export const CANCELLABLE_STATUSES: ReservationStatus[] = ['PAYMENT_PENDING', 'PAID'];
export const TERMINAL_STATUSES: ReservationStatus[] = ['COMPLETED', 'CANCELLED', 'REJECTED', 'PAYMENT_FAILED'];

export const STATUS_LABELS: Record<ReservationStatus, string> = {
  PAYMENT_PENDING: 'Payment needed',
  PAID: 'Payment captured',
  PAYMENT_FAILED: 'Payment failed',
  CANCELLED: 'Cancelled',
  ASSIGNED: 'Being planned',
  IN_PROGRESS: 'In progress',
  CONFIRMED: 'Confirmed & sealed',
  REJECTED: 'Could not be arranged',
  COMPLETED: 'Completed',
};

export function mayLeaveFeedback(status: ReservationStatus, hasFeedback: boolean) {
  return status === 'COMPLETED' && !hasFeedback;
}
