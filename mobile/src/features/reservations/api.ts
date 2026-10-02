import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';
import { api } from '@/api/client';
import type { CreateReservationPayload, Reservation, ReservationReveal } from '@/types/api';

import { withEffectiveStatus } from './status';

export const reservationKeys = {
  all: ['reservations'] as const,
  detail: (id: string) => ['reservations', id] as const,
  reveal: (id: string) => ['reservations', id, 'reveal'] as const,
};

export function getRevealRefetchInterval(reveal: ReservationReveal | undefined, now = Date.now()) {
  if (reveal?.available) return false;
  if (!reveal?.reservation.confirmedReservationAt) return 30_000;
  const until = new Date(reveal.reservation.confirmedReservationAt).getTime() - now;
  if (until <= 0) return 15_000;
  return Math.min(until + 500, 30 * 60_000);
}

export function useReservations(enabled = true) {
  return useQuery({ queryKey: reservationKeys.all, queryFn: () => api<Reservation[]>('/api/v1/reservations'), enabled, select: (items) => items.map((item) => withEffectiveStatus(item)) });
}

export function useReservation(id: string) {
  return useQuery({
    queryKey: reservationKeys.detail(id),
    queryFn: () => api<Reservation>(`/api/v1/reservations/${id}`),
    enabled: Boolean(id),
    select: (reservation) => withEffectiveStatus(reservation),
  });
}

export function useReveal(id: string) {
  return useQuery({
    queryKey: reservationKeys.reveal(id),
    queryFn: () => api<ReservationReveal>(`/api/v1/reservations/${id}/reveal`),
    enabled: Boolean(id),
    refetchInterval: (query) => getRevealRefetchInterval(query.state.data),
  });
}

export function useDemoReveal(id: string) {
  return useMutation({
    mutationFn: () => api<ReservationReveal>(`/api/v1/reservations/${id}/demo-reveal`, { method: 'POST' }),
  });
}

export async function createReservation(payload: CreateReservationPayload, idempotencyKey = randomUUID()) {
  return api<Reservation>('/api/v1/reservations', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(payload),
  });
}

export async function payReservation(id: string, paymentMethodToken: string, idempotencyKey = randomUUID()) {
  return api<Reservation>(`/api/v1/reservations/${id}/payments`, {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ paymentMethodToken }),
  });
}

export function useCancelReservation(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => api<void>(`/api/v1/reservations/${id}/cancellation`, { method: 'POST' }),
    onSuccess: () => Promise.all([
      client.invalidateQueries({ queryKey: reservationKeys.all }),
      client.invalidateQueries({ queryKey: reservationKeys.detail(id) }),
    ]),
  });
}

export function useSubmitFeedback(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { rating: number; comment: string | null; wouldReturnForSurpriseMenu: boolean }) =>
      api<Reservation>(`/api/v1/reservations/${id}/feedback`, { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => Promise.all([
      client.invalidateQueries({ queryKey: reservationKeys.all }),
      client.invalidateQueries({ queryKey: reservationKeys.detail(id) }),
    ]),
  });
}
