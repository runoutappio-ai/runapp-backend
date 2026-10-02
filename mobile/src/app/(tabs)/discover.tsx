import { Compass } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Eyebrow, Screen, Title } from '@/components/ui';
import { colors } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

const MOODS = [
  { label: 'Date night', vibe: 'Date Night' },
  { label: 'Ladies’ night', vibe: 'Ladies’ Night' },
  { label: 'Guys’ night', vibe: 'Guys’ Night' },
  { label: 'Friends', vibe: 'Casual' },
  { label: 'Extreme', vibe: 'Extreme' },
  { label: 'Birthday', vibe: 'Birthday' },
  { label: 'Dress to impress', vibe: 'Dress to Impress' },
] as const;

export default function DiscoverScreen() {
  const { colors: themeColors } = useTheme();
  return (
    <Screen>
      <View style={styles.header}><Eyebrow>Explore the unexpected</Eyebrow><Title>Discover</Title></View>
      <Card style={styles.hero}>
        <View style={[styles.icon, { backgroundColor: themeColors.glassPick, borderColor: themeColors.glassPickBorder }]}><Compass color={themeColors.gold} size={17} strokeWidth={1.8} /></View>
        <Text style={[styles.heading, { color: themeColors.text }]}>Let the night surprise you.</Text>
        <Text style={[styles.body, { color: themeColors.glassText }]}>We match your mood, budget and location with a restaurant worth waiting for.</Text>
        <Button onPress={() => router.push('/booking')}>Start a mystery</Button>
      </Card>
      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: themeColors.text }]}>Start with a mood</Text>
        <Text style={[styles.body, { color: themeColors.glassText }]}>Pick a feeling and we’ll handle the restaurant, menu and surprise.</Text>
        <View style={styles.moods}>
          {MOODS.map(({ label, vibe }) => (
            <Pressable key={label} accessibilityRole="button" onPress={() => router.push(`/booking?vibe=${encodeURIComponent(vibe)}` as never)} style={({ pressed }) => [styles.chip, { backgroundColor: pressed ? themeColors.glassPick : themeColors.glassTrack, borderColor: pressed ? themeColors.glassPickBorder : themeColors.glassBorder }]}>
              <Text style={[styles.chipText, { color: themeColors.text }]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </Card>
      <Card style={styles.card}>
        <Text style={[styles.cardTitle, { color: themeColors.text }]}>How Run Out works</Text>
        {['Tell us your mood, budget and neighbourhood.', 'We choose a restaurant worth discovering.', 'The menu stays sealed until it is time to go.'].map((line, index) => (
          <Text key={line} style={[styles.step, { color: themeColors.glassText }]}><Text style={{ color: themeColors.gold, fontWeight: '700' }}>0{index + 1}</Text>  {line}</Text>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 4 },
  hero: { gap: 10 },
  card: { gap: 8 },
  icon: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  heading: { color: colors.text, fontSize: 19, lineHeight: 23, fontWeight: '800', letterSpacing: -0.3 },
  body: { fontSize: 12.5, lineHeight: 18 },
  cardTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  moods: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  chip: { height: 30, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, justifyContent: 'center' },
  chipText: { fontSize: 12, fontWeight: '600' },
  step: { fontSize: 12.5, lineHeight: 19 },
});
