import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'runout.theme.mode';

export const darkTheme = {
  background: '#0D0B0C', backgroundSecondary: '#160D12', surface: '#171315', surfaceRaised: '#241A1F',
  line: '#1F1B1C', text: '#F9F2E8', textSoft: '#D6D2D3', muted: '#9E9698', faint: '#77727A',
  gold: '#EBC46C', goldSoft: '#CDB89A', primaryText: '#251316', border: '#34262C', selected: '#231E1D',
  accentSurface: '#3A1522', accentBorder: 'rgba(235, 196, 108, 0.55)', selectedBorder: '#3A3234', success: '#58D68D', danger: '#FF8C86', white: '#FFFFFF',
} as const;

export const lightTheme = {
  background: '#F8F3EE', backgroundSecondary: '#F0E1E4', surface: '#DCEAF3', surfaceRaised: '#CFE1EB',
  line: '#A9C8D5', text: '#123B35', textSoft: '#1F5048', muted: '#2D5E56', faint: '#486F68',
  gold: '#1E5A4D', goldSoft: '#2B6358', primaryText: '#F7FCFA', border: '#94B8C7', selected: '#C5DDE8',
  accentSurface: '#C9E0EB', accentBorder: '#4E8174', selectedBorder: '#9BBBC6', success: '#26754E', danger: '#9C3E48', white: '#FFFFFF',
} as const;

type Theme = { [key in keyof typeof darkTheme]: string };
type ThemeContextValue = { mode: 'dark' | 'light'; isLight: boolean; colors: Theme; setLight: (light: boolean) => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: PropsWithChildren) {
  const [mode, setMode] = useState<'dark' | 'light'>('dark');
  useEffect(() => { void AsyncStorage.getItem(STORAGE_KEY).then((value) => { if (value === 'light' || value === 'dark') setMode(value); }); }, []);
  const setLight = useCallback((light: boolean) => {
    const next = light ? 'light' : 'dark';
    setMode(next);
    void AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);
  const value = useMemo(() => ({ mode, isLight: mode === 'light', colors: mode === 'light' ? lightTheme : darkTheme, setLight }), [mode, setLight]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}
