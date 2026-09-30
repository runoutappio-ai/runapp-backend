/**
 * In-browser mock of the Run Out API, used only when EXPO_PUBLIC_DEMO_MODE=true.
 * Every request the app makes through `api()` / `publicApi()` is answered here,
 * so the web demo works on static hosting with no backend or Keycloak.
 * State lives in localStorage (web) or memory, and is seeded relative to "now".
 */
import type { Reservation, ReservationReveal, Restaurant, User, UserProfile } from '@/types/api';

type DemoState = { version: 1; users: Record<string, User>; reservations: Record<string, Reservation[]>; revealed: string[] };
type Json = unknown;

const STORAGE_KEY = 'runout.demo.v1';
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

const RESTAURANTS: Restaurant[] = [
  {
    id: 'demo-saffron', name: 'Saffron & Sumac', cuisine: 'MIDDLE_EASTERN_RESTAURANT', description: 'Wood-fired Levantine plates.',
    formattedAddress: 'Bay Avenue, Business Bay, Dubai', latitude: 25.1865, longitude: 55.2728, googleMapsUri: null, tags: ['Date Night'],
    menus: [{ id: 1, entries: { 'Smoked Aubergine Mutabal': 'Charred aubergine, tahini, pomegranate molasses', 'Lamb Shoulder Ouzi': 'Twelve-hour lamb, spiced rice, toasted almonds', 'Knafeh': 'Warm Nabulsi cheese, orange-blossom syrup, pistachio' } }],
  },
  {
    id: 'demo-lumiere', name: 'Maison Lumière', cuisine: 'FRENCH_RESTAURANT', description: 'A small modern bistro.',
    formattedAddress: 'Jumeirah Beach Road, Jumeirah, Dubai', latitude: 25.2048, longitude: 55.2398, googleMapsUri: null, tags: ['Dress to Impress'],
    menus: [{ id: 2, entries: { 'Tuna Crudo': 'Citrus, fennel, brown butter crumb', 'Duck à l’Orange': 'Roasted breast, glazed endive, jus', 'Chocolate Soufflé': 'Salted caramel, crème fraîche' } }],
  },
  {
    id: 'demo-koen', name: 'Kōen Robata', cuisine: 'JAPANESE_RESTAURANT', description: 'Charcoal grill and sake bar.',
    formattedAddress: 'Marina Walk, Dubai Marina, Dubai', latitude: 25.0805, longitude: 55.1403, googleMapsUri: null, tags: ['Casual'],
    menus: [{ id: 3, entries: { 'Yellowtail Tataki': 'Ponzu, yuzu kosho, crispy shallot', 'Miso Black Cod': 'Saikyo miso, pickled ginger', 'Matcha Mochi': 'Red bean, black sesame' } }],
  },
  {
    id: 'demo-nonna', name: 'Trattoria Nonna Vita', cuisine: 'ITALIAN_RESTAURANT', description: 'Family-style pasta kitchen.',
    formattedAddress: 'Alserkal Avenue, Al Quoz, Dubai', latitude: 25.1417, longitude: 55.2256, googleMapsUri: null, tags: ['Birthday'],
    menus: [{ id: 4, entries: { 'Burrata Pugliese': 'Heritage tomatoes, basil oil', 'Cacio e Pepe': 'Hand-rolled tonnarelli, pecorino, black pepper', 'Tiramisù della Casa': 'Mascarpone, espresso, cocoa' } }],
  },
];

const EMPTY_PROFILE: UserProfile = {
  phone: null, birthDate: null, dietaryPreferences: [], allergyNotes: null,
  marketingNotificationsEnabled: false, reservationNotificationsEnabled: true, address: null,
};

let memory: DemoState | null = null;

function storage() {
  try { return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null; } catch { return null; }
}
function load(): DemoState {
  if (memory) return memory;
  try {
    const raw = storage()?.getItem(STORAGE_KEY);
    if (raw) { memory = JSON.parse(raw) as DemoState; return memory; }
  } catch { /* fall through to a fresh state */ }
  memory = { version: 1, users: {}, reservations: {}, revealed: [] };
  return memory;
}
function save() {
  try { storage()?.setItem(STORAGE_KEY, JSON.stringify(load())); } catch { /* storage may be unavailable (private mode) — memory still works */ }
}

function id() {
  return `demo-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}
function restaurantFor(reservationId: string) {
  const sum = [...reservationId].reduce((total, char) => total + char.charCodeAt(0), 0);
  return RESTAURANTS[sum % RESTAURANTS.length];
}
function atHour(daysFromNow: number, hour: number) {
  const date = new Date(Date.now() + daysFromNow * DAY);
  date.setHours(hour, 0, 0, 0);
  return date;
}

function makeReservation(input: Partial<Reservation> & { reservationAt: string; partySize: number; total: number }): Reservation {
  const start = new Date(input.reservationAt);
  return {
    id: input.id ?? id(),
    status: input.status ?? 'PAYMENT_PENDING',
    reservationAt: input.reservationAt,
    timeWindowStartAt: start.toISOString(),
    timeWindowEndAt: new Date(start.getTime() + HOUR).toISOString(),
    excludedCuisineTypes: input.excludedCuisineTypes ?? [],
    vibe: input.vibe ?? 'Date Night',
    dietaryPreferences: input.dietaryPreferences ?? [],
    allergyNotes: input.allergyNotes ?? null,
    locationLabel: input.locationLabel ?? 'Business Bay, Dubai, United Arab Emirates',
    partySize: input.partySize,
    budgetPerPerson: { amount: Math.round(input.total / input.partySize), currency: 'AED' },
    totalBudget: { amount: input.total, currency: 'AED' },
    searchArea: input.searchArea ?? { latitude: 25.1865, longitude: 55.2728, radiusMeters: 5000 },
    payment: input.payment ?? null,
    assignedEmployeeId: null,
    restaurantId: input.restaurantId ?? null,
    externalReference: null,
    confirmedReservationAt: input.confirmedReservationAt ?? null,
    feedback: input.feedback ?? null,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}

function seedReservations(): Reservation[] {
  const upcoming = atHour(2, 20).toISOString();
  const past1 = atHour(-9, 20).toISOString();
  const past2 = atHour(-24, 13).toISOString();
  return [
    makeReservation({ reservationAt: upcoming, confirmedReservationAt: upcoming, partySize: 2, total: 400, status: 'CONFIRMED', payment: { reference: 'demo-pay-1', status: 'CAPTURED' }, vibe: 'Date Night' }),
    makeReservation({ reservationAt: past1, confirmedReservationAt: past1, partySize: 4, total: 600, status: 'COMPLETED', payment: { reference: 'demo-pay-2', status: 'CAPTURED' }, vibe: 'Casual' }),
    makeReservation({ reservationAt: past2, confirmedReservationAt: past2, partySize: 2, total: 300, status: 'COMPLETED', payment: { reference: 'demo-pay-3', status: 'CAPTURED' }, vibe: 'Birthday',
      feedback: { rating: 5, comment: 'Loved the surprise!', wouldReturnForSurpriseMenu: true, submittedAt: atHour(-23, 10).toISOString() } }),
  ];
}

function ensureUser(email: string, displayName?: string): User {
  const state = load();
  const key = email.trim().toLowerCase();
  if (!state.users[key]) {
    const name = displayName?.trim() || key.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Guest';
    state.users[key] = { id: `user-${key}`, displayName: name, email: key, role: 'CUSTOMER', profile: { ...EMPTY_PROFILE } };
    state.reservations[key] = seedReservations();
    save();
  }
  return state.users[key];
}

function tokensFor(email: string) {
  const token = `demo.${encodeURIComponent(email.trim().toLowerCase())}`;
  return { accessToken: token, refreshToken: token, expiresIn: 3600, refreshExpiresIn: 86400, tokenType: 'Bearer' };
}
function emailFrom(headers: Headers) {
  const auth = headers.get('Authorization') ?? '';
  const match = /^Bearer demo\.(.+)$/.exec(auth);
  return match ? decodeURIComponent(match[1]) : null;
}

function reveal(reservation: Reservation, forced: boolean): ReservationReveal {
  const state = load();
  const time = new Date(reservation.confirmedReservationAt ?? reservation.reservationAt).getTime();
  const available = forced || reservation.status === 'COMPLETED' || (reservation.status === 'CONFIRMED' && time <= Date.now()) || state.revealed.includes(reservation.id);
  const restaurant = restaurantFor(reservation.id);
  return { available, status: reservation.status, reservation, restaurant: available ? restaurant : null, menu: available ? restaurant.menus : null };
}

function respond(status: number, body?: Json) {
  if (status === 204 || body === undefined) return new Response(null, { status: status === 200 ? 204 : status });
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}
function problem(status: number, detail: string) {
  return respond(status, { title: detail, detail, status });
}

async function readBody(init: RequestInit) {
  if (typeof init.body !== 'string') return {} as Record<string, unknown>;
  try { return JSON.parse(init.body) as Record<string, unknown>; } catch { return {}; }
}

export async function demoFetch(url: string, init: RequestInit = {}): Promise<Response> {
  await new Promise((resolve) => setTimeout(resolve, 250)); // feel like a network call
  const { pathname, searchParams } = new URL(url, 'https://demo.runout.local');
  const method = (init.method ?? 'GET').toUpperCase();
  const headers = new Headers(init.headers);
  const body = await readBody(init);
  const state = load();

  // Public endpoints
  if (pathname === '/api/v1/auth/login' && method === 'POST') {
    const email = String(body.email ?? '').trim();
    if (!email || !String(body.password ?? '')) return problem(400, 'Enter your email and password.');
    ensureUser(email);
    return respond(200, tokensFor(email));
  }
  if (pathname === '/api/v1/users/registrations' && method === 'POST') {
    const email = String(body.email ?? '').trim();
    if (!email) return problem(400, 'Enter your email.');
    ensureUser(email, String(body.displayName ?? ''));
    return respond(201, { ok: true });
  }
  if (pathname === '/api/v1/auth/refresh' && method === 'POST') {
    const token = String(body.refreshToken ?? '');
    const email = token.startsWith('demo.') ? decodeURIComponent(token.slice(5)) : null;
    return email ? respond(200, tokensFor(email)) : problem(401, 'Your session has expired.');
  }
  if (pathname === '/api/v1/locations/search') {
    const query = searchParams.get('query') ?? 'Dubai';
    return respond(200, [{ label: query.replace(/, UAE$/, ', United Arab Emirates'), placeId: `demo-${query}`, latitude: 25.2048, longitude: 55.2708 }]);
  }
  if (pathname === '/api/v1/locations/reverse-geocode' && method === 'POST') {
    return respond(200, { label: 'Downtown Dubai, Dubai, United Arab Emirates', placeId: 'demo-downtown', latitude: Number(body.latitude ?? 25.1972), longitude: Number(body.longitude ?? 55.2744) });
  }

  // Authenticated endpoints
  const email = emailFrom(headers);
  if (!email) return problem(401, 'Please sign in to continue.');
  const user = ensureUser(email);
  const list = state.reservations[user.email] ?? (state.reservations[user.email] = []);

  if (pathname === '/api/v1/auth/logout') return respond(204);
  if (pathname === '/api/v1/users/me' || pathname === '/api/v1/users/me/provision') return respond(200, user);
  if (pathname === '/api/v1/users/me/profile') {
    if (method === 'PATCH') { user.profile = { ...EMPTY_PROFILE, ...(body as Partial<UserProfile>) }; save(); }
    return respond(200, { profile: user.profile ?? EMPTY_PROFILE });
  }
  if (pathname === '/api/v1/reservations' && method === 'GET') return respond(200, list);
  if (pathname === '/api/v1/reservations' && method === 'POST') {
    const total = Number((body.totalBudget as { amount?: number } | undefined)?.amount ?? 200);
    const created = makeReservation({
      reservationAt: String(body.reservationAt ?? new Date(Date.now() + DAY).toISOString()),
      partySize: Number(body.partySize ?? 2), total,
      vibe: String(body.vibe ?? 'Casual'),
      excludedCuisineTypes: (body.excludedCuisineTypes as string[]) ?? [],
      dietaryPreferences: (body.dietaryPreferences as string[]) ?? [],
      allergyNotes: (body.allergyNotes as string | null) ?? null,
      locationLabel: (body.locationLabel as string) ?? null,
      searchArea: body.searchArea as Reservation['searchArea'],
    });
    list.unshift(created);
    save();
    return respond(201, created);
  }

  const match = /^\/api\/v1\/reservations\/([^/]+)(?:\/([a-z-]+))?$/.exec(pathname);
  if (match) {
    const reservation = list.find((item) => item.id === match[1]);
    if (!reservation) return problem(404, 'Reservation not found.');
    const action = match[2];
    if (!action) return respond(200, reservation);
    if (action === 'reveal') return respond(200, reveal(reservation, false));
    if (action === 'demo-reveal' && method === 'POST') {
      if (!state.revealed.includes(reservation.id)) state.revealed.push(reservation.id);
      save();
      return respond(200, reveal(reservation, true));
    }
    if (action === 'payments' && method === 'POST') {
      reservation.status = 'CONFIRMED';
      reservation.payment = { reference: `demo-pay-${reservation.id}`, status: 'CAPTURED' };
      reservation.confirmedReservationAt = reservation.reservationAt;
      save();
      return respond(200, reservation);
    }
    if (action === 'cancellation' && method === 'POST') {
      reservation.status = 'CANCELLED';
      save();
      return respond(204);
    }
    if (action === 'feedback' && method === 'POST') {
      reservation.feedback = {
        rating: Number(body.rating ?? 5), comment: (body.comment as string | null) ?? null,
        wouldReturnForSurpriseMenu: Boolean(body.wouldReturnForSurpriseMenu), submittedAt: new Date().toISOString(),
      };
      save();
      return respond(200, reservation);
    }
  }
  return problem(404, `Not available in the demo: ${method} ${pathname}`);
}

/** Wipes the demo data (used by the "Reset demo" action). */
export function resetDemo() {
  memory = { version: 1, users: {}, reservations: {}, revealed: [] };
  save();
}
