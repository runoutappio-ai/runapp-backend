import { Tabs } from 'expo-router';
import { AppTabBar } from '@/components/AppTabBar';

export default function TabLayout() {
  return <Tabs tabBar={(props) => <AppTabBar active={props.state.routes[props.state.index]?.name as 'index' | 'reservations' | 'discover' | 'profile'} />} screenOptions={{ headerShown: false }}>
    <Tabs.Screen name="index" /><Tabs.Screen name="reservations" /><Tabs.Screen name="discover" /><Tabs.Screen name="profile" />
  </Tabs>;
}
