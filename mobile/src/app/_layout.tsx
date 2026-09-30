import { type ReactNode, useEffect } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { Stack, router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/auth/AuthProvider';
import { BookingDraftProvider } from '@/features/booking/BookingDraftProvider';
import { installQueryLifecycle, queryClient } from '@/api/query';
import { colors } from '@/theme/tokens';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { installWebFontFallbacks } from '@/theme/webFonts';
import { WebPhoneFrame } from '@/components/WebPhoneFrame';

installWebFontFallbacks();

function Navigation() {
  const { user, ready } = useAuth();
  const { colors: themeColors } = useTheme();
  useEffect(() => {
    // expo-notifications is native-only. The web demo does not register or
    // inspect notification responses, but keeps this flow on iOS/Android.
    if (Platform.OS === 'web') return;
    const redirect = (notification: Notifications.Notification) => {
      const url = notification.request.content.data?.url;
      if (typeof url === 'string') router.push(url as never);
    };
    const last = Notifications.getLastNotificationResponse();
    if (last) redirect(last.notification);
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => redirect(response.notification));
    return () => subscription.remove();
  }, []);
  if (!ready) return <View style={[styles.loading, { backgroundColor: themeColors.background }]}><ActivityIndicator size="large" color={themeColors.gold} /></View>;
  return (
    <Stack initialRouteName="(auth)" screenOptions={{ headerStyle: { backgroundColor: themeColors.background }, headerTintColor: themeColors.gold, headerTitleStyle: { color: themeColors.text, fontSize: 16, fontWeight: '700' }, headerShadowVisible: false, headerBackButtonDisplayMode: 'minimal', contentStyle: { backgroundColor: themeColors.background } }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="booking" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      <Stack.Protected guard={Boolean(user)}>
        <Stack.Screen name="reservation/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="invite/[id]" options={{ headerShown: false, presentation: 'modal' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => installQueryLifecycle(), []);
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <WebFrame><ThemedApp /></WebFrame>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

/** On web, show the app inside an iPhone mockup on desktop screens (full screen on phones). */
function WebFrame({ children }: { children: ReactNode }) {
  return <WebPhoneFrame>{children}</WebPhoneFrame>;
}

function ThemedApp() {
  const { isLight } = useTheme();
  return <AuthProvider><BookingDraftProvider><StatusBar style={isLight ? 'dark' : 'light'} /><Navigation /></BookingDraftProvider></AuthProvider>;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
