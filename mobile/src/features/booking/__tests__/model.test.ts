import { CANCELLABLE_STATUSES, DUBAI_AREAS, initialDraft, kilometresToMetres, mayLeaveFeedback, toReservationPayload } from '../model';
import { locationPatch } from '../location';
import { requireCapturedPayment } from '../payment';

it('maps AED amounts, Dubai dates, and kilometres to backend fields', () => {
  const payload = toReservationPayload({ ...initialDraft, partySize: 4, totalBudget: 600, date: '2030-05-20', time: '20:15', locationLabel: 'DIFC, Dubai', latitude: 25.2118, longitude: 55.2796, radiusKm: 7 });
  expect(payload.reservationAt).toBe('2030-05-20T20:15:00+04:00');
  expect(payload.budgetPerPerson).toEqual({ amount: 150, currency: 'AED' });
  expect(payload.totalBudget).toEqual({ amount: 600, currency: 'AED' });
  expect(payload.searchArea.radiusMeters).toBe(7000); expect(kilometresToMetres(0.5)).toBe(500);
});

it('keeps Dubai areas usable when device permission is denied and shows reverse-geocoded street labels', () => {
  expect(DUBAI_AREAS).toHaveLength(15); expect(DUBAI_AREAS.find((area) => area.name === 'Dubai Marina')).toBeDefined();
  expect(locationPatch({ label: 'Gate Avenue, DIFC, Dubai, UAE', placeId: 'x', latitude: 25.21, longitude: 55.28 }).locationLabel).toBe('Gate Avenue, DIFC, Dubai, UAE');
});

it('gates payment, cancellation, and completed feedback correctly', () => {
  expect(requireCapturedPayment('CAPTURED')).toBe(true); expect(() => requireCapturedPayment('FAILED')).toThrow('failed');
  expect(CANCELLABLE_STATUSES).toEqual(['PAYMENT_PENDING', 'PAID']);
  expect(mayLeaveFeedback('COMPLETED', false)).toBe(true); expect(mayLeaveFeedback('COMPLETED', true)).toBe(false);
});
