import type { ReservationReveal } from '@/types/api';

export function canRenderRestaurant(reveal: ReservationReveal | null | undefined) {
  return reveal?.available === true && Boolean(reveal.restaurant);
}

export type RevealStage = 'sealed' | 'restaurant' | 'menu';

export function getRevealStage(
  scheduledReveal: ReservationReveal | null | undefined,
  demoReveal: ReservationReveal | null | undefined,
  demoMenuRevealed: boolean,
): RevealStage {
  if (canRenderRestaurant(scheduledReveal)) return 'menu';
  if (!canRenderRestaurant(demoReveal)) return 'sealed';
  return demoMenuRevealed ? 'menu' : 'restaurant';
}
