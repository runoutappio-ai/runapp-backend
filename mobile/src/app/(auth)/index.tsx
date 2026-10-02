import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/auth/AuthProvider';
import { config } from '@/config';
import { TestLoginButton } from '@/features/auth/TestLoginButton';
import { Button, InlineError, Monogram } from '@/components/ui';
import { GlassSurface, useGlassPill } from '@/components/Glass';
import { HERO_PHOTO } from '@/features/home/HomeHeroPhoto';
import { colors } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

const FADE_STEPS = 10;

export default function WelcomeScreen() {
  const { signInWithGoogle, signOut, busy, user } = useAuth();
  const { colors: themeColors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const glassPill = useGlassPill();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const [error, setError] = useState('');
  const photoHeight = Math.round(Math.min(620, height * 0.66));
  const google = async () => {
    setError('');
    try { await signInWithGoogle(); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not start Google sign-in.'); }
  };
  const continueAsGuest = async () => {
    await signOut();
    router.replace('/(tabs)');
  };
  useEffect(() => {
    if (user) router.replace(returnTo === '/booking' ? '/booking' : '/(tabs)');
  }, [returnTo, user]);
  const openAuth = (path: '/(auth)/register' | '/(auth)/sign-in') => router.push(`${path}${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}` as never);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]} edges={['left', 'right']}>
      <View pointerEvents="none" style={[styles.photoWrap, { height: photoHeight }]}>
        {HERO_PHOTO ? <Image source={HERO_PHOTO} resizeMode="cover" style={styles.photo} /> : null}
        <View style={styles.photoTopShade} />
        <View style={styles.fade}>
          {Array.from({ length: FADE_STEPS }, (_, i) => <View key={i} style={{ flex: 1, backgroundColor: themeColors.background, opacity: ((i + 1) / FADE_STEPS) ** 1.5 }} />)}
        </View>
      </View>

      <ScrollView contentInsetAdjustmentBehavior="never" automaticallyAdjustContentInsets={false} contentContainerStyle={[styles.content, { paddingTop: insets.top + 10, paddingBottom: Math.max(insets.bottom, 16) + 12 }]} keyboardShouldPersistTaps="handled">
        <View style={styles.brandRow}>
          <View style={styles.brandLeft}><Monogram size={26} /><Text style={styles.brandWord}>RUN OUT</Text></View>
          <View style={[styles.cityPill, glassPill]}><Text style={styles.cityText}>Dubai</Text></View>
        </View>

        <View style={styles.spacer} />

        <View style={styles.headlines}>
          <Text style={styles.headline}>No choosing where to go.</Text>
          <Text style={styles.headline}>No thinking what to eat.</Text>
          <Text style={[styles.headline, { color: themeColors.gold }]}>Get more for your money.</Text>
        </View>

        <GlassSurface radius={24} style={styles.panel}>
          <Text style={[styles.lede, { color: themeColors.glassText }]}>We choose the restaurant. The restaurant chooses the menu. You just show up.</Text>
          {error ? <InlineError message={error} /> : null}
          <Button onPress={google} loading={busy}>Continue with Google</Button>
          <View style={styles.pair}>
            <View style={styles.pairItem}><Button variant="secondary" onPress={() => openAuth('/(auth)/register')}>Create account</Button></View>
            <View style={styles.pairItem}><Button variant="secondary" onPress={() => openAuth('/(auth)/sign-in')}>Sign in</Button></View>
          </View>
          <View style={styles.links}>
            <Pressable accessibilityRole="button" onPress={() => void continueAsGuest()} hitSlop={8}><Text style={[styles.linkText, { color: themeColors.glassText }]}>Continue as guest</Text></Pressable>
            <TestLoginButton asLink />
          </View>
        </GlassSurface>

        <Text style={[styles.legal, { color: themeColors.faint }]}>By continuing you agree to the <Text style={[styles.legalLink, { color: themeColors.gold }]} onPress={() => config.termsUrl && Linking.openURL(config.termsUrl)}>Terms</Text> and <Text style={[styles.legalLink, { color: themeColors.gold }]} onPress={() => config.privacyUrl && Linking.openURL(config.privacyUrl)}>Privacy Policy</Text>.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  photoWrap: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden' },
  photo: { width: '100%', height: '100%' },
  photoTopShade: { position: 'absolute', top: 0, left: 0, right: 0, height: 120, backgroundColor: 'rgba(0, 0, 0, 0.25)' },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '50%' },
  content: { flexGrow: 1, paddingHorizontal: 16, gap: 14 },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  brandLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandWord: { color: colors.white, fontSize: 12, fontWeight: '800', letterSpacing: 3, textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 6 },
  cityPill: { height: 28, paddingHorizontal: 10, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  cityText: { color: colors.white, fontSize: 12, fontWeight: '600' },
  spacer: { flexGrow: 1, minHeight: 180 },
  headlines: { paddingHorizontal: 4, gap: 2 },
  headline: { color: colors.white, fontFamily: 'Avenir Next', fontSize: 25, lineHeight: 30, fontWeight: '800', letterSpacing: -0.6, textShadowColor: 'rgba(0,0,0,0.3)', textShadowRadius: 8 },
  panel: { padding: 16, gap: 10 },
  lede: { fontSize: 12.5, lineHeight: 18 },
  pair: { flexDirection: 'row', gap: 8 },
  pairItem: { flex: 1 },
  links: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, paddingTop: 2 },
  linkText: { fontSize: 12.5, fontWeight: '700' },
  legal: { textAlign: 'center', fontSize: 11, lineHeight: 16 },
  legalLink: { textDecorationLine: 'underline' },
});
