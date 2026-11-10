import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { publicApi } from '@/api/client';
import type { SearchArea } from '@/types/api';

export type RestaurantMatchCriteria = SearchArea & {
  anywhereInDubai: boolean;
  partySize: number;
  budgetPerPerson: number;
  vibe: string;
  excludedCuisines: string[];
  dietaryPreferences: string[];
  licensedVenue: boolean;
  shishaVenue: boolean;
};

export const RESTAURANT_MATCH_PATH = '/api/v1/restaurants/match-count';

export function useRestaurantMatchCount(criteria: RestaurantMatchCriteria | null) {
  const body = criteria ? JSON.stringify(criteria) : null;
  const [settledBody, setSettledBody] = useState<string | null>(null);

  useEffect(() => {
    if (body === null) return;
    const timer = setTimeout(() => setSettledBody(body), 350);
    return () => clearTimeout(timer);
  }, [body]);

  const ready = body !== null && settledBody === body;
  const query = useQuery({
    queryKey: ['restaurant-match-count', body],
    enabled: ready,
    queryFn: ({ signal }) => publicApi<{ count: number }>(RESTAURANT_MATCH_PATH, { method: 'POST', body, signal }),
    retry: false,
    staleTime: 15_000,
    gcTime: 60_000,
  });

  return {
    count: ready && query.isSuccess ? query.data.count : undefined,
    failed: ready && query.isError && !query.isFetching,
    retry: () => void query.refetch(),
  };
}
