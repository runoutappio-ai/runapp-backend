export const colors = {
  background: '#0D0B0C',
  backgroundSecondary: '#160D12',
  surface: '#171315',
  surfaceRaised: '#241A1F',
  surfaceSunken: '#0C0B0C',
  line: '#1F1B1C',
  selected: '#231E1D',
  selectedBorder: '#3A3234',
  accentSurface: '#3A1522',
  accentBorder: 'rgba(235, 196, 108, 0.55)',
  text: '#F9F2E8',
  textSoft: '#D6D2D3',
  muted: '#9E9698',
  faint: '#77727A',
  red: '#A9274B',
  redDark: '#671A36',
  burgundy: '#76213E',
  wine: '#6E2238',
  gold: '#EBC46C',
  goldSoft: '#CDB89A',
  primaryText: '#251316',
  success: '#58D68D',
  warning: '#F3C86B',
  border: '#34262C',
  dangerSurface: '#321823',
  danger: '#FF8C86',
  white: '#FFFFFF',
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const radius = { sm: 14, md: 18, card: 22, lg: 24, pill: 999 } as const;

/** Compact type scale shared by every screen. */
export const type = {
  display: { fontSize: 34, lineHeight: 38, fontWeight: '800', letterSpacing: -0.8 },
  title: { fontSize: 24, lineHeight: 29, fontWeight: '800', letterSpacing: -0.5 },
  titleMedium: { fontSize: 20, lineHeight: 24, fontWeight: '800', letterSpacing: -0.3 },
  section: { fontSize: 16, lineHeight: 21, fontWeight: '700', letterSpacing: -0.2 },
  body: { fontSize: 14, lineHeight: 20 },
  small: { fontSize: 12.5, lineHeight: 17 },
  caption: { fontSize: 11.5, lineHeight: 16 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.6, textTransform: 'uppercase' },
} as const;
