import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'runout.theme.mode';

export const darkTheme = {
  background: '#0D0B0C', backgroundSecondary: '#160D12', surface: '#171315', surfaceRaised: '#241A1F',
  line: '#1F1B1C', text: '#F9F2E8', textSoft: '#D6D2D3', muted: '#9E9698', faint: '#77727A',
  gold: '#EBC46C', goldSoft: '#CDB89A', primaryText: '#251316', border: '#34262C', selected: '#231E1D',
  accentSurface: '#3A1522', accentBorder: 'rgba(235, 196, 108, 0.55)', selectedBorder: '#3A3234', success: '#58D68D', danger: '#FF8C86', white: '#FFFFFF',
  // Glass (frosted) surfaces
  glass: 'rgba(30, 12, 19, 0.42)', glassSolid: 'rgba(30, 14, 20, 0.86)', glassBorder: 'rgba(255, 255, 255, 0.14)', glassTrack: 'rgba(255, 255, 255, 0.06)',
  glassActive: 'rgba(255, 255, 255, 0.16)', glassActiveBorder: 'rgba(255, 255, 255, 0.22)', glassPick: 'rgba(235, 196, 108, 0.18)', glassPickBorder: 'rgba(235, 196, 108, 0.7)',
  glassText: 'rgba(255, 255, 255, 0.65)', glassDivider: 'rgba(255, 255, 255, 0.08)', bar: 'rgba(14, 12, 13, 0.72)', barSolid: 'rgba(14, 12, 13, 0.94)',
} as const;

export const lightTheme = {
  background: '#F8F3EE', backgroundSecondary: '#F0E1E4', surface: '#DCEAF3', surfaceRaised: '#CFE1EB',
  line: '#A9C8D5', text: '#123B35', textSoft: '#1F5048', muted: '#2D5E56', faint: '#486F68',
  gold: '#1E5A4D', goldSoft: '#2B6358', primaryText: '#F7FCFA', border: '#94B8C7', selected: '#C5DDE8',
  accentSurface: '#C9E0EB', accentBorder: '#4E8174', selectedBorder: '#9BBBC6', success: '#26754E', danger: '#9C3E48', white: '#FFFFFF',
  glass: 'rgba(255, 255, 255, 0.55)', glassSolid: 'rgba(255, 255, 255, 0.9)', glassBorder: 'rgba(18, 59, 53, 0.14)', glassTrack: 'rgba(18, 59, 53, 0.06)',
  glassActive: 'rgba(255, 255, 255, 0.85)', glassActiveBorder: 'rgba(18, 59, 53, 0.2)', glassPick: 'rgba(30, 90, 77, 0.14)', glassPickBorder: 'rgba(30, 90, 77, 0.7)',
  glassText: 'rgba(18, 59, 53, 0.7)', glassDivider: 'rgba(18, 59, 53, 0.1)', bar: 'rgba(248, 243, 238, 0.78)', barSolid: 'rgba(248, 243, 238, 0.96)',
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
