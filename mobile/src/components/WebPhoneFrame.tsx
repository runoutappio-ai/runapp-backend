import { type ReactNode, useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaFrameContext, SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Web only. On a desktop-sized window the app is shown inside an iPhone-style mockup
 * (bezel, Dynamic Island, status bar, home indicator), scaled to fit the window.
 * On phone-sized windows the app simply fills the screen.
 */
const SCREEN = { width: 390, height: 844 };
const BEZEL = 12;
const PHONE = { width: SCREEN.width + BEZEL * 2, height: SCREEN.height + BEZEL * 2 };
const INSETS = { top: 54, bottom: 30, left: 0, right: 0 };
const FRAME = { x: 0, y: 0, ...SCREEN };

function useClock() {
  const format = () => new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
  const [time, setTime] = useState(format);
  useEffect(() => {
    const id = setInterval(() => setTime(format()), 15_000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function StatusBar({ color }: { color: string }) {
  const time = useClock();
  return (
    <View pointerEvents="none" style={styles.statusBar}>
      <Text style={[styles.time, { color }]}>{time}</Text>
      <View style={styles.statusIcons}>
        <View style={styles.signal}>{[5, 7, 9, 11].map((h) => <View key={h} style={[styles.signalBar, { height: h, backgroundColor: color }]} />)}</View>
        <View style={styles.wifi}>
          <View style={[styles.wifiArc, styles.wifiArcLarge, { borderColor: color }]} />
          <View style={[styles.wifiArc, styles.wifiArcSmall, { borderColor: color }]} />
          <View style={[styles.wifiDot, { backgroundColor: color }]} />
        </View>
        <View style={[styles.battery, { borderColor: color }]}><View style={[styles.batteryLevel, { backgroundColor: color }]} /></View>
        <View style={[styles.batteryCap, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

export function WebPhoneFrame({ children }: { children: ReactNode }) {
  const { width, height } = useWindowDimensions();
  const { colors, isLight } = useTheme();
  if (Platform.OS !== 'web') return <>{children}</>;

  const mockup = width >= 600 && height >= 560;
  if (!mockup) return <View style={[styles.fill, { backgroundColor: colors.background }]}>{children}</View>;

  const scale = Math.min(1, (height - 48) / PHONE.height, (width - 48) / PHONE.width);
  const showCaption = width >= 1040;
  const ink = isLight ? '#141214' : '#F9F2E8';

  return (
    <View style={styles.backdrop}>
      <View pointerEvents="none" style={styles.glowA} />
      <View pointerEvents="none" style={styles.glowB} />
      <View style={styles.row}>
        {showCaption ? (
          <View style={styles.caption}>
            <Text style={styles.kicker}>RUN OUT · LIVE DEMO</Text>
            <Text style={styles.headline}>A mystery dinner,{'\n'}sealed until the night.</Text>
            <Text style={styles.lede}>Tap through the real app: book a table, pay (nothing is charged), then skip the wait to open the envelope and read the menu.</Text>
          </View>
        ) : null}
        <View style={{ width: PHONE.width * scale, height: PHONE.height * scale }}>
          <View style={[styles.phone, { transform: [{ scale }], left: (PHONE.width * scale - PHONE.width) / 2, top: (PHONE.height * scale - PHONE.height) / 2 }]}>
            <View style={[styles.button, styles.buttonAction]} />
            <View style={[styles.button, styles.buttonVolUp]} />
            <View style={[styles.button, styles.buttonVolDown]} />
            <View style={[styles.button, styles.buttonPower]} />
            <View style={[styles.screen, { backgroundColor: colors.background }]}>
              <SafeAreaFrameContext.Provider value={FRAME}>
                <SafeAreaInsetsContext.Provider value={INSETS}>
                  <View style={styles.fill}>{children}</View>
                </SafeAreaInsetsContext.Provider>
              </SafeAreaFrameContext.Provider>
              <StatusBar color={ink} />
              <View pointerEvents="none" style={styles.island} />
              <View pointerEvents="none" style={[styles.homeIndicator, { backgroundColor: ink }]} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#070506', overflow: 'hidden' },
  glowA: { position: 'absolute', width: 900, height: 900, borderRadius: 450, backgroundColor: '#3A1522', opacity: 0.35, top: -420, left: -260 },
  glowB: { position: 'absolute', width: 700, height: 700, borderRadius: 350, backgroundColor: '#EBC46C', opacity: 0.05, bottom: -380, right: -200 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 72 },
  caption: { width: 360, gap: 14 },
  kicker: { color: '#EBC46C', fontFamily: 'Avenir Next', fontSize: 11, fontWeight: '800', letterSpacing: 2.4 },
  headline: { color: '#F9F2E8', fontFamily: 'Avenir Next', fontSize: 34, lineHeight: 40, fontWeight: '700', letterSpacing: -0.8 },
  lede: { color: '#9E9698', fontFamily: 'Avenir Next', fontSize: 15, lineHeight: 23 },
  phone: { position: 'absolute', width: PHONE.width, height: PHONE.height, borderRadius: 62, padding: BEZEL, backgroundColor: '#0B0B0C', borderWidth: 2, borderColor: '#3A3A3E', shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 40, shadowOffset: { width: 0, height: 30 } },
  screen: { flex: 1, borderRadius: 50, overflow: 'hidden' },
  island: { position: 'absolute', top: 11, alignSelf: 'center', width: 124, height: 36, borderRadius: 18, backgroundColor: '#000' },
  statusBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 42, paddingRight: 32, paddingTop: 4 },
  time: { fontFamily: 'Avenir Next', fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  statusIcons: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  signal: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 11 },
  signalBar: { width: 3, borderRadius: 1 },
  wifi: { width: 16, height: 12, alignItems: 'center', justifyContent: 'flex-end' },
  wifiArc: { position: 'absolute', borderTopWidth: 2, borderLeftWidth: 2, borderRightWidth: 2, borderBottomWidth: 0, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  wifiArcLarge: { width: 16, height: 10, top: 0 },
  wifiArcSmall: { width: 9, height: 6, top: 4 },
  wifiDot: { width: 3, height: 3, borderRadius: 2 },
  battery: { width: 25, height: 12, borderRadius: 4, borderWidth: 1, padding: 1.5, opacity: 0.9 },
  batteryLevel: { flex: 1, borderRadius: 2 },
  batteryCap: { width: 2, height: 4, borderRadius: 1, marginLeft: -4, opacity: 0.5 },
  homeIndicator: { position: 'absolute', bottom: 8, alignSelf: 'center', width: 134, height: 5, borderRadius: 3, opacity: 0.85 },
  button: { position: 'absolute', width: 4, backgroundColor: '#2A2A2E', borderRadius: 2 },
  buttonAction: { left: -5, top: 118, height: 32 },
  buttonVolUp: { left: -5, top: 178, height: 62 },
  buttonVolDown: { left: -5, top: 254, height: 62 },
  buttonPower: { right: -5, top: 210, height: 96 },
});
