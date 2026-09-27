import { canRenderRestaurant, getRevealStage } from '../privacy';
import { getRevealRefetchInterval } from '../api';

it('hides restaurant data until the reveal endpoint explicitly authorizes it', () => {
  expect(canRenderRestaurant({ available: false, status: 'CONFIRMED', reservation: {} as never, restaurant: { name: 'Secret' } as never, menu: [] })).toBe(false);
  expect(canRenderRestaurant({ available: true, status: 'CONFIRMED', reservation: {} as never, restaurant: { name: 'Revealed' } as never, menu: [] })).toBe(true);
});

it('polls through confirmation and reaches the reveal at the confirmed hour', () => {
  const base = { available: false, status: 'CONFIRMED', restaurant: null, menu: null } as const;
  expect(getRevealRefetchInterval({ ...base, reservation: { confirmedReservationAt: null } } as never, 1_000)).toBe(30_000);
  expect(getRevealRefetchInterval({ ...base, reservation: { confirmedReservationAt: new Date(61_000).toISOString() } } as never, 1_000)).toBe(60_500);
  expect(getRevealRefetchInterval({ ...base, reservation: { confirmedReservationAt: new Date(1_000).toISOString() } } as never, 1_000)).toBe(15_000);
  expect(getRevealRefetchInterval({ ...base, available: true, reservation: { confirmedReservationAt: new Date(1_000).toISOString() } } as never, 1_000)).toBe(false);
});

it('reveals the restaurant before the menu in demo mode', () => {
  const hidden = { available: false, restaurant: null } as never;
  const available = { available: true, restaurant: { name: 'Demo restaurant' } } as never;

  expect(getRevealStage(hidden, undefined, false)).toBe('sealed');
  expect(getRevealStage(hidden, available, false)).toBe('restaurant');
  expect(getRevealStage(hidden, available, true)).toBe('menu');
  expect(getRevealStage(available, undefined, false)).toBe('menu');
});
