import type { PropsWithChildren } from 'react';
import { Image, Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { HERO_PHOTO } from '@/features/home/HomeHeroPhoto';
import { useTheme } from '@/theme/ThemeProvider';

/**
 * Frosted "glass" surface used across the app.
 * - iOS 26+: native Liquid Glass (expo-glass-effect).
 * - Web: translucent fill + CSS backdrop blur.
 * - Everything else: a slightly more opaque tinted fill (no live blur available).
 */
const liquidGlass = Platform.OS === 'ios' && isLiquidGlassAvailable();
const webBlur = (px: number) => (Platform.OS === 'web' ? ({ backdropFilter: `blur(${px}px) saturate(140%)` } as unknown as ViewStyle) : null);

export function GlassSurface({ children, style, radius = 20, blur = 22 }: PropsWithChildren<{ style?: StyleProp<ViewStyle>; radius?: number; blur?: number }>) {
  const { colors, isLight } = useTheme();
  if (liquidGlass) {
    return (
      <GlassView glassEffectStyle="regular" colorScheme={isLight ? 'light' : 'dark'} tintColor={isLight ? 'rgba(255,255,255,0.25)' : 'rgba(40,12,22,0.35)'} style={[{ borderRadius: radius, borderWidth: 1, borderColor: colors.glassBorder, overflow: 'hidden' }, style]}>
        {children}
      </GlassView>
    );
  }
  return (
    <View style={[{ borderRadius: radius, borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: Platform.OS === 'web' ? colors.glass : colors.glassSolid, overflow: 'hidden' }, webBlur(blur), style]}>
      {children}
    </View>
  );
}

/** Style for small glass elements (pills, round buttons, chips) that are plain Views/Pressables. */
export function useGlassPill() {
  const { colors } = useTheme();
  return [{ backgroundColor: Platform.OS === 'web' ? colors.glassTrack : colors.glassSolid, borderWidth: 1, borderColor: colors.glassBorder }, webBlur(16)] as StyleProp<ViewStyle>;
}

/** Translucent bar background (tab bar, sticky footers). */
export function useGlassBar() {
  const { colors } = useTheme();
  return [{ backgroundColor: Platform.OS === 'web' ? colors.bar : colors.barSolid }, webBlur(20)] as StyleProp<ViewStyle>;
}

const FADE_STEPS = 10;

/**
 * Ambient light behind the top of a screen: the hero photo, heavily blurred, fading into the page.
 * Gives the glass something warm to show through on screens without their own photo.
 */
export function AmbientBackground({ height = 420 }: { height?: number }) {
  const { colors, isLight } = useTheme();
  return (
    <View pointerEvents="none" style={[styles.root, { height }]}>
      {HERO_PHOTO ? <Image source={HERO_PHOTO} blurRadius={Platform.OS === 'web' ? 40 : 30} resizeMode="cover" style={[styles.photo, { opacity: isLight ? 0.45 : 0.75 }]} /> : null}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, opacity: isLight ? 0.35 : 0.15 }]} />
      <View style={styles.fade}>
        {Array.from({ length: FADE_STEPS }, (_, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: colors.background, opacity: ((i + 1) / FADE_STEPS) ** 1.4 }} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden' },
  photo: { position: 'absolute', top: -60, left: -60, right: -60, bottom: -20, width: undefined, height: undefined },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '70%' },
});
