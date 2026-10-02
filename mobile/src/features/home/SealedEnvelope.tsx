import { useEffect, type ReactNode } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  interpolate,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '@/theme/tokens';

type Props = {
  open?: boolean;
  letterTitle?: string;
  children?: ReactNode;
};

const W = 300;
const H = 186;
const RISE = 92; // how far the letter slides out when opened
const FLAP = Math.round(H * 0.56);
const SERIF = Platform.select({ ios: 'Didot', android: 'serif', default: 'Georgia, serif' });
const SERIF_ITALIC = Platform.select({ ios: 'Didot-Italic', android: 'serif', default: 'Georgia, serif' });

const TITLES: Record<string, string> = { 'YOUR MENU': 'Your menu', RESTAURANT: 'The restaurant' };

export function SealedEnvelope({ open = false, letterTitle = 'YOUR MENU', children }: Props) {
  const float = useSharedValue(0);
  const opening = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (open) {
      float.value = withTiming(0, { duration: reducedMotion ? 0 : 200 });
      opening.value = withDelay(reducedMotion ? 0 : 250, withTiming(1, { duration: reducedMotion ? 0 : 1100, easing: Easing.inOut(Easing.cubic) }));
      return;
    }
    opening.value = withTiming(0, { duration: reducedMotion ? 0 : 200 });
    float.value = reducedMotion
      ? 0
      : withRepeat(withSequence(withTiming(-6, { duration: 1800, easing: Easing.inOut(Easing.ease) }), withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.ease) })), -1, true);
  }, [float, open, opening, reducedMotion]);

  const envelopeMotion = useAnimatedStyle(() => ({ transform: [{ translateY: float.value }] }));
  // The front flap folds up to nothing during the first half…
  const closedFlap = useAnimatedStyle(() => ({
    opacity: interpolate(opening.value, [0, 0.42, 0.45], [1, 1, 0]),
    transform: [{ scaleY: interpolate(opening.value, [0, 0.45], [1, 0], 'clamp') }],
  }));
  // …then reappears behind the letter, pointing up.
  const openFlap = useAnimatedStyle(() => ({
    opacity: interpolate(opening.value, [0, 0.44, 0.46], [0, 0, 1]),
    transform: [{ scaleY: interpolate(opening.value, [0.45, 0.8], [0, 1], 'clamp') }],
  }));
  const letterMotion = useAnimatedStyle(() => ({ transform: [{ translateY: interpolate(opening.value, [0.5, 1], [0, -RISE], 'clamp') }] }));
  const sealMotion = useAnimatedStyle(() => ({
    opacity: interpolate(opening.value, [0, 0.25], [1, 0], 'clamp'),
    transform: [{ scale: interpolate(opening.value, [0, 0.12, 0.25], [1, 1.15, 0.6], 'clamp') }],
  }));

  const title = open ? TITLES[letterTitle] ?? letterTitle : 'Sealed';

  return (
    <View style={styles.root} accessibilityLabel={open ? 'The mystery dinner envelope is opening' : 'A sealed mystery dinner envelope'}>
      <Animated.View style={[styles.stage, envelopeMotion]}>
        <View style={styles.back} />
        <Animated.View style={[styles.openFlap, openFlap]} />
        <Animated.View style={[styles.letter, letterMotion]}>
          <View style={styles.letterFrame}>
            <Text style={styles.letterEyebrow}>RUN OUT</Text>
            <Text style={styles.letterTitle}>{title}</Text>
            <View style={styles.letterRule} />
          </View>
        </Animated.View>
        <View style={styles.pocketClip}>
          <View style={styles.pocket} />
          <View style={styles.pocketLining} />
        </View>
        <Animated.View style={[styles.closedFlap, styles.closedFlapLine, closedFlap]} />
        <Animated.View style={[styles.closedFlap, closedFlap]} />
        <Animated.View style={[styles.seal, sealMotion]}>
          <View style={styles.sealRing}>
            <Text style={styles.sealR}>R</Text>
            <Text style={styles.sealO}>O</Text>
          </View>
        </Animated.View>
      </Animated.View>
      {open && children ? (
        <Animated.View entering={FadeInDown.delay(reducedMotion ? 0 : 1300).duration(600).reduceMotion(ReduceMotion.System)} style={styles.contents}>
          {children}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: '100%', alignItems: 'center' },
  stage: { width: W, height: H + RISE + 8, marginTop: 4 },
  back: { position: 'absolute', bottom: 0, width: W, height: H, borderRadius: 16, backgroundColor: '#E2D2B2', borderWidth: 1, borderColor: '#D9C49A' },
  openFlap: { position: 'absolute', bottom: H - 1, left: 0, width: 0, height: 0, borderLeftWidth: W / 2, borderRightWidth: W / 2, borderBottomWidth: FLAP, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#E4D3B2', transformOrigin: 'bottom' },
  letter: { position: 'absolute', bottom: 14, left: 20, width: W - 40, height: H - 30, borderRadius: 6, backgroundColor: '#FFFDF7', padding: 8, shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  letterFrame: { flex: 1, borderWidth: 1, borderColor: '#C9A55A', borderRadius: 3, alignItems: 'center', paddingTop: 16, gap: 6 },
  letterEyebrow: { color: '#8A6A3A', fontSize: 9, fontWeight: '700', letterSpacing: 3 },
  letterTitle: { color: '#3A1321', fontFamily: SERIF_ITALIC, fontStyle: 'italic', fontSize: 24 },
  letterRule: { width: 56, height: 1, backgroundColor: '#C9A55A' },
  pocketClip: { position: 'absolute', bottom: 0, width: W, height: H, borderRadius: 16, overflow: 'hidden' },
  // Zero-size box with four borders = the classic envelope pocket (left, right, bottom folds; open top).
  pocket: { width: 0, height: 0, borderLeftWidth: W / 2, borderRightWidth: W / 2, borderTopWidth: Math.round(H * 0.44), borderBottomWidth: H - Math.round(H * 0.44), borderTopColor: 'transparent', borderLeftColor: '#F1E6D0', borderRightColor: '#EDE0C6', borderBottomColor: '#E8D9BB' },
  pocketLining: { position: 'absolute', left: 12, right: 12, bottom: 10, height: 1, backgroundColor: 'rgba(185, 150, 90, 0.45)' },
  closedFlap: { position: 'absolute', bottom: H - FLAP, left: 0, width: 0, height: 0, borderLeftWidth: W / 2, borderRightWidth: W / 2, borderTopWidth: FLAP, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#EADCBE', transformOrigin: 'top' },
  closedFlapLine: { borderTopWidth: FLAP + 1.5, borderTopColor: '#CDB27A' },
  seal: { position: 'absolute', bottom: H - FLAP - 24, left: W / 2 - 25, width: 50, height: 50, borderRadius: 25, backgroundColor: '#7A2842', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 6 },
  sealRing: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(235, 196, 108, 0.45)', flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', paddingTop: 7 },
  sealR: { color: colors.gold, fontFamily: SERIF_ITALIC, fontStyle: 'italic', fontSize: 20, fontWeight: '600' },
  sealO: { color: colors.gold, fontFamily: SERIF, fontStyle: 'italic', fontSize: 14, fontWeight: '600', marginLeft: -3 },
  contents: { width: '100%', gap: 14, marginTop: 4 },
});
