import { Compass, Flame, Heart, Sparkles, UsersRound } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Body, Button, Card, Eyebrow, Screen, Title } from '@/components/ui';
import { colors, radius } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export default function DiscoverScreen() {
  const { colors: themeColors, isLight } = useTheme();
  const moods = [
    { label: 'Date night', vibe: 'Date Night', Icon: Heart, color: '#FF6697', background: '#311126' },
    { label: 'Friends', vibe: 'Casual', Icon: UsersRound, color: '#EBC46C', background: '#33240D' },
    { label: 'Spicy', vibe: 'Extreme', Icon: Flame, color: '#FF754E', background: '#351513' },
    { label: 'Surprise me', vibe: 'Birthday', Icon: Sparkles, color: '#A98CFF', background: '#1D1638' },
  ] as const;
  return (
    <Screen>
      <View style={styles.header}><Eyebrow>Explore the unexpected</Eyebrow><Title>Discover</Title></View>
      <View style={[styles.hero, isLight && { backgroundColor: '#B9D8E5' }]}>
        <View pointerEvents="none" style={styles.heroShade} />
        <View pointerEvents="none" style={styles.heroGlow} />
        <View style={[styles.icon, isLight && { backgroundColor: 'rgba(24, 61, 56, 0.12)' }]}><Compass color={isLight ? themeColors.text : colors.text} size={18} strokeWidth={1.8} /></View>
        <Text style={[styles.heading, isLight && { color: themeColors.text }]}>Let the night surprise you.</Text>
        <Text style={[styles.heroBody, isLight && { color: themeColors.textSoft }]}>We match your mood, budget and location with a restaurant worth waiting for.</Text>
        <Button onPress={() => router.push('/booking')}>Start a mystery</Button>
      </View>
      <Card style={isLight ? { backgroundColor: themeColors.surface, borderColor: themeColors.border } : undefined}>
        <View style={styles.row}><View style={[styles.rowIcon, isLight && { backgroundColor: themeColors.accentSurface }]}><Sparkles color={themeColors.gold} size={16} strokeWidth={1.9} /></View><Text style={[styles.cardTitle, { color: themeColors.text }]}>Choose a mood</Text></View>
        <Body muted>Start with a feeling and we’ll handle the restaurant, menu and surprise.</Body>
        <View style={styles.moods}>{moods.map(({ label, vibe, Icon, color, background }) => <Pressable key={label} onPress={() => router.push(`/booking?vibe=${encodeURIComponent(vibe)}` as never)} style={styles.mood}><View style={[styles.moodIcon, { backgroundColor: background }]}><Icon color={color} size={19} strokeWidth={1.9} /></View><Text style={[styles.moodLabel, { color: themeColors.textSoft }]}>{label}</Text></Pressable>)}</View>
      </Card>
      <Card style={isLight ? { backgroundColor: themeColors.surface, borderColor: themeColors.border } : undefined}>
        <Text style={[styles.cardTitle, { color: themeColors.text }]}>How Run Out works</Text>
        <Text style={[styles.step, { color: themeColors.textSoft }]}><Text style={{ color: themeColors.gold }}>01</Text> Tell us your mood, budget and neighbourhood.</Text>
        <Text style={[styles.step, { color: themeColors.textSoft }]}><Text style={{ color: themeColors.gold }}>02</Text> We choose a restaurant worth discovering.</Text>
        <Text style={[styles.step, { color: themeColors.textSoft }]}><Text style={{ color: themeColors.gold }}>03</Text> The menu stays sealed until it is time to go.</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 4 },
  hero: { padding: 20, gap: 10, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.wine },
  heroShade: { position: 'absolute', right: -60, bottom: -80, width: 260, height: 220, borderRadius: 130, backgroundColor: '#2A0F1A', opacity: 0.7 },
  heroGlow: { position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: colors.gold, opacity: 0.14 },
  icon: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.18)', alignItems: 'center', justifyContent: 'center' },
  heading: { color: colors.white, fontSize: 20, lineHeight: 24, fontWeight: '800', letterSpacing: -0.3 },
  heroBody: { color: '#EFDCC8', fontSize: 13, lineHeight: 19 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2A1A14', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  moods: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 4 },
  mood: { flex: 1, alignItems: 'center', gap: 5 },
  moodIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  moodLabel: { fontSize: 10.5, fontWeight: '600', textAlign: 'center' },
  step: { fontSize: 13, lineHeight: 20 },
});
