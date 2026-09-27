import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';
import { initialDraft, type BookingDraft } from './model';

const STORAGE_KEY = 'runout.bookingDraft.v1';
type Action =
  | { type: 'patch'; value: Partial<BookingDraft> }
  | { type: 'reset' }
  | { type: 'hydrate'; value: BookingDraft };

function reducer(state: BookingDraft, action: Action): BookingDraft {
  if (action.type === 'reset') return initialDraft;
  if (action.type === 'hydrate') return action.value;
  return { ...state, ...action.value };
}

type DraftContextValue = {
  draft: BookingDraft;
  hydrated: boolean;
  update: (value: Partial<BookingDraft>) => void;
  reset: () => void;
};
const DraftContext = createContext<DraftContextValue | null>(null);

export function BookingDraftProvider({ children }: PropsWithChildren) {
  const [draft, dispatch] = useReducer(reducer, initialDraft);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored) dispatch({ type: 'hydrate', value: { ...initialDraft, ...JSON.parse(stored) } as BookingDraft });
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (hydrated) void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft, hydrated]);

  const update = useCallback((value: Partial<BookingDraft>) => dispatch({ type: 'patch', value }), []);
  const reset = useCallback(() => {
    dispatch({ type: 'reset' });
    void AsyncStorage.removeItem(STORAGE_KEY);
  }, []);
  const value = useMemo(() => ({ draft, hydrated, update, reset }), [draft, hydrated, reset, update]);
  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

export function useBookingDraft() {
  const context = useContext(DraftContext);
  if (!context) throw new Error('useBookingDraft must be used in BookingDraftProvider');
  return context;
}
