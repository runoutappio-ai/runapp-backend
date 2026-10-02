import { Image, type ImageSourcePropType, StyleSheet, Text, View } from 'react-native';

/**
 * Full-bleed photo at the top of Home that fades into the page background.
 *
 * To use the real photo: add it to assets/images (e.g. home-hero.jpg) and set
 *   export const HERO_PHOTO: ImageSourcePropType | null = require('../../../assets/images/home-hero.jpg');
 * Until then a warm placeholder is shown.
 * Photo direction: friends laughing and sharing dishes at a Dubai terrace at dusk — no alcohol.
 */
// Photo supplied by the product owner (cropped so faces sit above the Mystery Dinner card).
// The earlier illustration is kept in assets/source/home-hero.svg.
// eslint-disable-next-line @typescript-eslint/no-require-imports
export const HERO_PHOTO: ImageSourcePropType | null = require('../../../assets/images/home-hero.jpg');

const FADE_STEPS = 10;

export function HomeHeroPhoto({ height, background }: { height: number; background: string }) {
  return (
    <View pointerEvents="none" style={[styles.root, { height }]}>
      {HERO_PHOTO ? (
        <Image source={HERO_PHOTO} resizeMode="cover" style={[StyleSheet.absoluteFill, styles.photo]} accessibilityIgnoresInvertColors />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.placeholder]}>
          <View style={[styles.bokeh, { left: -30, top: 40, width: 190, height: 190, backgroundColor: '#FFD696', opacity: 0.35 }]} />
          <View style={[styles.bokeh, { right: -20, top: 10, width: 140, height: 140, backgroundColor: '#FFBE78', opacity: 0.3 }]} />
          <View style={[styles.bokeh, { left: 150, top: 120, width: 120, height: 120, backgroundColor: '#FFE6BE', opacity: 0.2 }]} />
          <Text style={styles.placeholderText}>PHOTO · friends sharing dinner on a Dubai terrace</Text>
        </View>
      )}
      {/* soft darkening at the top so the status bar and brand row stay readable (banded, no hard edge) */}
      <View style={styles.topShade}>
        {Array.from({ length: FADE_STEPS }, (_, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: '#000', opacity: 0.38 * (1 - i / FADE_STEPS) ** 1.4 }} />
        ))}
      </View>
      {/* fade into the page: stacked bands (no gradient dependency needed) */}
      <View style={styles.fade}>
        {Array.from({ length: FADE_STEPS }, (_, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: background, opacity: ((i + 1) / FADE_STEPS) ** 1.6 }} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden' },
  placeholder: { backgroundColor: '#8A3A3C' },
  photo: { width: '100%', height: '100%' },
  bokeh: { position: 'absolute', borderRadius: 999 },
  placeholderText: { position: 'absolute', left: 20, top: '45%', color: 'rgba(255, 243, 223, 0.8)', fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  topShade: { position: 'absolute', top: 0, left: 0, right: 0, height: 150 },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%' },
});
