import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, interpolate, runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { X } from 'lucide-react-native';
import { colors } from '@/theme/tokens';

const SERIF = Platform.select({ ios: 'Didot', android: 'serif', default: 'Georgia, serif' });
const SERIF_ITALIC = Platform.select({ ios: 'Didot-Italic', android: 'serif', default: 'Georgia, serif' });

type Props = {
  visible: boolean;
  onClose: () => void;
  countdown?: string;
  when?: string;
  partySize?: number;
};

/**
 * Full-screen moment for Home's "Open": the little envelope grows into the middle of the
 * screen, the wax seal pops, the flap folds back and the letter slides out with the countdown.
 * Rendered by Home at screen level (not a Modal) so on web it stays inside the phone mockup.
 */
export function EnvelopeReveal({ visible, onClose, countdown, when, partySize }: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const W = Math.min(Math.max(screenWidth, 320) - 56, 320);
  const H = Math.round(W / 1.55);
  const RISE = Math.round(H * 0.62);
  const FLAP = Math.round(H * 0.5);
  const POCKET_TOP = Math.round(H * 0.44);
  const progress = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (visible) progress.value = withTiming(1, { duration: reducedMotion ? 0 : 1700, easing: Easing.inOut(Easing.cubic) });
  }, [progress, reducedMotion, visible]);

  const close = () => {
    progress.value = withTiming(0, { duration: reducedMotion ? 0 : 450, easing: Easing.in(Easing.cubic) }, (done) => { if (done) runOnJS(onClose)(); });
  };

  const backdrop = useAnimatedStyle(() => ({ opacity: interpolate(progress.value, [0, 0.2], [0, 1], 'clamp') }));
  // 0 → 0.3: the envelope expands from small to full size.
  const stage = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.12], [0, 1], 'clamp'),
    transform: [{ scale: interpolate(progress.value, [0, 0.3], [0.42, 1], 'clamp') }, { translateY: interpolate(progress.value, [0, 0.3], [60, 0], 'clamp') }],
  }));
  // 0.32 → 0.42: the seal pops; 0.4 → 0.58: the flap folds back; 0.58 → 0.75 it stands behind the letter.
  const seal = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.32, 0.42], [1, 0], 'clamp'),
    transform: [{ scale: interpolate(progress.value, [0.3, 0.35, 0.42], [1, 1.2, 0.5], 'clamp') }],
  }));
  const closedFlap = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.56, 0.58], [1, 1, 0]),
    transform: [{ scaleY: interpolate(progress.value, [0.4, 0.58], [1, 0], 'clamp') }],
  }));
  const openFlap = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.57, 0.59], [0, 0, 1]),
    transform: [{ scaleY: interpolate(progress.value, [0.58, 0.75], [0, 1], 'clamp') }],
  }));
  // 0.65 → 1: the letter slides out.
  const letter = useAnimatedStyle(() => ({ transform: [{ translateY: interpolate(progress.value, [0.65, 1], [0, -RISE], 'clamp') }] }));
  const closeButton = useAnimatedStyle(() => ({ opacity: interpolate(progress.value, [0.85, 1], [0, 1], 'clamp') }));

  if (!visible) return null;
  const half = W / 2;

  return (
    <View style={StyleSheet.absoluteFill} accessibilityViewIsModal>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdrop]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close the envelope" style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>
      <View pointerEvents="box-none" style={styles.center}>
        <Animated.View pointerEvents="none" style={[{ width: W, height: H + RISE }, stage]}>
          <View style={[styles.back, { width: W, height: H }]} />
          <Animated.View style={[styles.openFlap, { bottom: H - 1, borderLeftWidth: half, borderRightWidth: half, borderBottomWidth: FLAP }, openFlap]} />
          <Animated.View
            accessible
            accessibilityLabel={countdown ? `Next reveal in ${countdown}. ${when ?? ''}` : 'Your envelope'}
            style={[styles.letter, { left: 16, width: W - 32, height: H - 26 }, letter]}>
            <View style={styles.letterFrame}>
              <Text style={styles.eyebrow}>RUN OUT · NEXT REVEAL IN</Text>
              <Text numberOfLines={1} adjustsFontSizeToFit style={styles.countdown}>{countdown ?? '—'}</Text>
              {when ? <Text numberOfLines={1} style={styles.when}>{when}</Text> : null}
              <View style={styles.rule} />
              <Text style={styles.note}>{partySize ? `Table for ${partySize} · ` : ''}The restaurant and menu stay sealed until then.</Text>
            </View>
          </Animated.View>
          <View style={[styles.pocketClip, { width: W, height: H }]}>
            <View style={[styles.pocket, { borderLeftWidth: half, borderRightWidth: half, borderTopWidth: POCKET_TOP, borderBottomWidth: H - POCKET_TOP }]} />
          </View>
          <Animated.View style={[styles.closedFlap, { bottom: H - FLAP, borderLeftWidth: half, borderRightWidth: half, borderTopWidth: FLAP + 2, borderTopColor: '#C4A66C' }, closedFlap]} />
          <Animated.View style={[styles.closedFlap, { bottom: H - FLAP, borderLeftWidth: half, borderRightWidth: half, borderTopWidth: FLAP }, closedFlap]} />
          <Animated.View style={[styles.seal, { bottom: H - FLAP - 22, left: half - 22 }, seal]}>
            <Text style={styles.sealR}>R</Text><Text style={styles.sealO}>O</Text>
          </Animated.View>
        </Animated.View>
        <Animated.View style={closeButton}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} hitSlop={8} style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.85 }]}>
            <X color={colors.text} size={15} strokeWidth={2.2} />
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(8, 6, 7, 0.82)', ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(14px)' } as object) : null) },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 22, paddingBottom: 40 },
  back: { position: 'absolute', bottom: 0, left: 0, borderRadius: 14, backgroundColor: '#E2D2B2', borderWidth: 1, borderColor: '#D9C49A', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 12 }, elevation: 8 },
  openFlap: { position: 'absolute', left: 0, width: 0, height: 0, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#E4D3B2', transformOrigin: 'bottom' },
  letter: { position: 'absolute', bottom: 13, borderRadius: 6, backgroundColor: '#FFFDF7', padding: 7, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  letterFrame: { flex: 1, borderWidth: 1, borderColor: '#C9A55A', borderRadius: 3, alignItems: 'center', paddingTop: 14, paddingHorizontal: 12, gap: 3 },
  eyebrow: { color: '#8A6A3A', fontSize: 8.5, fontWeight: '800', letterSpacing: 1.8 },
  countdown: { color: '#2B1A12', fontSize: 32, lineHeight: 38, fontWeight: '800', letterSpacing: -0.8 },
  when: { color: '#6E4E2A', fontFamily: SERIF_ITALIC, fontStyle: 'italic', fontSize: 13 },
  rule: { width: 48, height: 1, backgroundColor: '#C9A55A', marginVertical: 6 },
  note: { color: '#6E4E2A', fontSize: 11, lineHeight: 15, textAlign: 'center' },
  pocketClip: { position: 'absolute', bottom: 0, left: 0, borderRadius: 14, overflow: 'hidden' },
  pocket: { width: 0, height: 0, borderTopColor: 'transparent', borderLeftColor: '#F1E6D0', borderRightColor: '#EDE0C6', borderBottomColor: '#E8D9BB' },
  closedFlap: { position: 'absolute', left: 0, width: 0, height: 0, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#E6D4B0', transformOrigin: 'top' },
  seal: { position: 'absolute', width: 44, height: 44, borderRadius: 22, backgroundColor: '#7A2842', borderWidth: 2, borderColor: '#5C1B30', flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', paddingTop: 7, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 6 },
  sealR: { color: colors.gold, fontFamily: SERIF_ITALIC, fontStyle: 'italic', fontSize: 19, fontWeight: '600' },
  sealO: { color: colors.gold, fontFamily: SERIF, fontStyle: 'italic', fontSize: 13, fontWeight: '600', marginLeft: -2 },
  closeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 18, borderRadius: 999, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.18)' },
  closeText: { color: colors.text, fontSize: 13.5, fontWeight: '700' },
});
