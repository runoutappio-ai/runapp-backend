import { Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuth } from '@/auth/AuthProvider';
import { config } from '@/config';
import { TestLoginButton } from '@/features/auth/TestLoginButton';
import { Button, Eyebrow, InlineError, Screen } from '@/components/ui';
import { colors } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export default function WelcomeScreen() {
  const { signInWithGoogle, signOut, busy, user } = useAuth();
  const { colors: themeColors } = useTheme();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const [error, setError] = useState('');
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
    <Screen>
      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <Eyebrow>Run Out</Eyebrow>
          <Text style={[styles.headline, { color: themeColors.text }]}>No choosing where to go.</Text>
          <Text style={[styles.headline, { color: themeColors.text }]}>No thinking about what to eat.</Text>
          <Text style={[styles.headlineAccent, { color: themeColors.gold }]}>Get more for your money.</Text>
          <Text style={[styles.lede, { color: themeColors.muted }]}>We choose the restaurant. The restaurant chooses the menu. You just show up, enjoy the surprise and get more on your table than you paid for.</Text>
        </View>
      </View>
      {error ? <InlineError message={error} /> : null}
      <Button onPress={google} loading={busy}>Continue with Google</Button>
      {Platform.OS === 'ios' ? <Button variant="secondary" disabled>Continue with Apple — release setup required</Button> : null}
      <Button variant="secondary" onPress={() => openAuth('/(auth)/register')}>Create account with email</Button>
      <Button variant="ghost" onPress={() => openAuth('/(auth)/sign-in')}>Sign in with email</Button>
      <Button variant="ghost" onPress={() => void continueAsGuest()}>Continue as guest</Button>
      <TestLoginButton />
      <Text style={[styles.legal, { color: themeColors.faint }]}>By continuing you agree to the <Text style={[styles.link, { color: themeColors.gold }]} onPress={() => config.termsUrl && Linking.openURL(config.termsUrl)}>Terms</Text> and <Text style={[styles.link, { color: themeColors.gold }]} onPress={() => config.privacyUrl && Linking.openURL(config.privacyUrl)}>Privacy Policy</Text>.</Text>
    </Screen>
  );
}
const styles = StyleSheet.create({
  hero: { flex: 1, justifyContent: 'center', gap: 28, minHeight: 340 },
  heroCopy: { gap: 10 },
  headline: { color: colors.text, fontFamily: 'Avenir Next', fontSize: 27, lineHeight: 31, fontWeight: '700', letterSpacing: -0.8 },
  headlineAccent: { color: colors.gold, fontFamily: 'Avenir Next', fontSize: 27, lineHeight: 31, fontWeight: '700', letterSpacing: -0.8 },
  lede: { color: colors.muted, fontFamily: 'Avenir Next', fontSize: 14, lineHeight: 21, marginTop: 4 },
  legal: { color: colors.faint, textAlign: 'center', fontSize: 11.5, lineHeight: 17 },
  link: { color: colors.gold, textDecorationLine: 'underline' },
});
