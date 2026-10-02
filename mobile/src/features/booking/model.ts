import type { CreateReservationPayload, ReservationStatus } from '@/types/api';

export const VIBES = ['Casual', 'Date Night', 'Ladies’ Night', 'Guys’ Night', 'Extreme', 'Birthday', 'Dress to Impress'] as const;

/** Cheeky one-liners shown under the chosen vibe; a new one is picked every time a vibe is tapped. */
export const VIBE_LINES: Record<string, string[]> = {
  Casual: [
    'Zero dress code, zero stress — flip-flops fully authorised.',
    'Come as you are. Yes, even in that hoodie.',
    'Low effort, high flavour. The dream.',
    'Sweatpants energy, five-star appetite.',
  ],
  'Date Night': [
    'Candles, good food and zero awkward silences. Hopefully.',
    'Dress to impress — they’ll be looking at you, not the menu.',
    'If this goes well, you owe us a wedding invite.',
    'Pro tip: let them have the last bite. Trust us.',
    'Butterflies included. Breath mints not.',
  ],
  'Ladies’ Night': [
    'Heels optional, gossip mandatory.',
    'What happens at dinner stays in the group chat.',
    'Table for queens. Kings may wave from a distance.',
    'Bring the stories you can’t post online.',
    'Fully booked: one table, zero boyfriends.',
  ],
  'Guys’ Night': [
    'Leave the group chat. Bring the appetite.',
    'Loudest table in the room — we’ve warned the staff.',
    'Whoever checks their phone first pays for dessert.',
    'No small talk. Only big plates.',
    'Bros before diets. Tonight, anyway.',
  ],
  Extreme: [
    'Bring a spare tongue. You might need it.',
    'Chilli level: call your mum first.',
    'Only for the brave, the bold and the slightly reckless.',
    'If you’re not sweating, we did it wrong.',
  ],
  Birthday: [
    'Another year older, still the main character.',
    'Candles on the cake, eyes on you.',
    'Age is just a number. Dessert is a priority.',
    'Make a wish — we already took care of the table.',
  ],
  'Dress to Impress': [
    'Iron the shirt. Polish the shoes. Own the room.',
    'Tonight the outfit gets its own reservation.',
    'Best dressed table wins. You’re in the lead.',
    'Overdressed is not a thing. Underdressed is.',
  ],
};

/** Cheeky lines for the per-person budget slider, one pool per AED 50 step; a new one each time the value changes. */
export const BUDGET_LINES: Record<number, string[]> = {
  50: [
    'The waiter will refill your water and nothing else.',
    'Bold move. We respect the hustle.',
    'Shawarma-level ambition. Respectable.',
    'Your wallet called. It says thank you.',
    'Budget mode: on. Expectations: managed.',
  ],
  100: [
    'Relaxed, delicious, and comfortably within budget.',
    'Good food, no regrets on payday.',
    'Fancy enough to post, cheap enough to repeat.',
    'The sweet spot between “treat” and “rent”.',
  ],
  150: [
    'Now we’re talking. Napkins might even be cloth.',
    'Enough for a starter you can’t pronounce.',
    'You’re officially a “let’s split a dessert” person.',
    'Mid-week treat or Friday flex — your call.',
  ],
  200: [
    'A table made for a proper night out.',
    'This is where waiters start remembering your name.',
    'Dessert is no longer a debate.',
    'Main-character budget unlocked.',
  ],
  250: [
    'Sharing plates? Optional. Showing off? Encouraged.',
    'The kind of dinner you text your friends about.',
    'Somebody’s getting the tasting menu.',
    'Your ex would be impressed. Just saying.',
  ],
  300: [
    'Chef’s-table energy. Wear something nice.',
    'Iron the shirt — this place has a dress code vibe.',
    'You’re not hungry, you’re curious. Big difference.',
    'Expect at least one dish served under a dome.',
  ],
  350: [
    'High roller alert. The sommelier of mocktails awaits.',
    'At this price the bread basket comes with a story.',
    'Plates so pretty you’ll feel bad eating them. You won’t.',
    'This is “celebrating something” money. Celebrate anyway.',
  ],
  400: [
    'Go big or go home. Actually, don’t go home.',
    'Gold-flake territory. Dubai would be proud.',
    'Somebody got a bonus. We won’t tell.',
    'Valet, velvet chairs, the works.',
    'You’re basically funding the chef’s next holiday.',
  ],
};

export function randomBudgetLine(perPerson: number, avoid?: string) {
  const lines = BUDGET_LINES[perPerson] ?? BUDGET_LINES[100];
  const pool = lines.length > 1 && avoid ? lines.filter((line) => line !== avoid) : lines;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function randomVibeLine(vibe: string, avoid?: string) {
  const lines = VIBE_LINES[vibe] ?? [`We’ll shape the surprise around a ${vibe.toLowerCase()} mood.`];
  const pool = lines.length > 1 && avoid ? lines.filter((line) => line !== avoid) : lines;
  return pool[Math.floor(Math.random() * pool.length)];
}
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
  /** Only restaurants licensed to serve alcohol (21+). */
  licensedVenue: boolean;
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
  licensedVenue: false,
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
    licensedVenue: Boolean(draft.licensedVenue),
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
