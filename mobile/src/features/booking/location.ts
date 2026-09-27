import type { LocationCandidate } from '@/types/api';
import type { BookingDraft } from './model';

export function locationPatch(candidate: LocationCandidate): Partial<BookingDraft> {
  return { locationLabel: candidate.label, latitude: candidate.latitude, longitude: candidate.longitude };
}
