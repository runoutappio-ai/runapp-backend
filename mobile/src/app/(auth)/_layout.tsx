import { Stack } from 'expo-router';
import { colors } from '@/theme/tokens';
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false, headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.gold, headerTitleStyle: { color: colors.text, fontSize: 16, fontWeight: '700' }, headerShadowVisible: false, headerBackButtonDisplayMode: 'minimal', contentStyle: { backgroundColor: colors.background } }} />;
}
