import type { Reservation, ReservationStatus } from '@/types/api';

/** Paid reservations whose time has passed are shown as completed, even before the backend catches up. */
const AUTO_COMPLETE: ReservationStatus[] = ['PAID', 'ASSIGNED', 'IN_PROGRESS', 'CONFIRMED'];

export function withEffectiveStatus(reservation: Reservation, now = Date.now()): Reservation {
  const at = new Date(reservation.confirmedReservationAt ?? reservation.reservationAt).getTime();
  return AUTO_COMPLETE.includes(reservation.status) && at <= now ? { ...reservation, status: 'COMPLETED' } : reservation;
}
