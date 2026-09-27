import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack, router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/auth/AuthProvider';
import { BookingDraftProvider } from '@/features/booking/BookingDraftProvider';
import { installQueryLifecycle, queryClient } from '@/api/query';
import { colors } from '@/theme/tokens';

function Navigation() {
  const { user, ready } = useAuth();
  useEffect(() => {
    const redirect = (notification: Notifications.Notification) => {
      const url = notification.request.content.data?.url;
      if (typeof url === 'string') router.push(url as never);
    };
    const last = Notifications.getLastNotificationResponse();
    if (last) redirect(last.notification);
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => redirect(response.notification));
    return () => subscription.remove();
  }, []);
  if (!ready) return <View style={styles.loading}><ActivityIndicator size="large" color={colors.gold} /></View>;
  return (
    <Stack initialRouteName="(auth)" screenOptions={{ headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.gold, headerTitleStyle: { color: colors.text, fontSize: 16, fontWeight: '700' }, headerShadowVisible: false, headerBackButtonDisplayMode: 'minimal', contentStyle: { backgroundColor: colors.background } }}>
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
        <AuthProvider>
          <BookingDraftProvider><StatusBar style="light" /><Navigation /></BookingDraftProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({ loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background } });
