import type { Reservation } from '@/types/api';
import { withEffectiveStatus } from '../status';

const base = { id: 'r1', reservationAt: '2026-10-01T20:00:00+04:00', confirmedReservationAt: null } as unknown as Reservation;
const at = (iso: string) => new Date(iso).getTime();

describe('withEffectiveStatus', () => {
  it('marks a paid reservation completed once its time has passed', () => {
    expect(withEffectiveStatus({ ...base, status: 'CONFIRMED' }, at('2026-10-01T20:01:00+04:00')).status).toBe('COMPLETED');
    expect(withEffectiveStatus({ ...base, status: 'PAID' }, at('2026-10-02T09:00:00+04:00')).status).toBe('COMPLETED');
  });
  it('leaves future, unpaid and cancelled reservations alone', () => {
    expect(withEffectiveStatus({ ...base, status: 'CONFIRMED' }, at('2026-10-01T19:59:00+04:00')).status).toBe('CONFIRMED');
    expect(withEffectiveStatus({ ...base, status: 'PAYMENT_PENDING' }, at('2026-10-02T09:00:00+04:00')).status).toBe('PAYMENT_PENDING');
    expect(withEffectiveStatus({ ...base, status: 'CANCELLED' }, at('2026-10-02T09:00:00+04:00')).status).toBe('CANCELLED');
  });
  it('uses the confirmed time when the restaurant moved the booking', () => {
    const moved = { ...base, status: 'CONFIRMED', confirmedReservationAt: '2026-10-01T21:00:00+04:00' } as Reservation;
    expect(withEffectiveStatus(moved, at('2026-10-01T20:30:00+04:00')).status).toBe('CONFIRMED');
  });
});
