import { Compass, Sparkles } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { Body, Card, Eyebrow, Screen, Title } from '@/components/ui';
import { colors, radius } from '@/theme/tokens';

export default function DiscoverScreen() {
  return (
    <Screen>
      <View style={styles.header}><Eyebrow>Explore the unexpected</Eyebrow><Title>Discover</Title></View>
      <View style={styles.hero}>
        <View pointerEvents="none" style={styles.heroShade} />
        <View pointerEvents="none" style={styles.heroGlow} />
        <View style={styles.icon}><Compass color={colors.text} size={18} strokeWidth={1.8} /></View>
        <Text style={styles.heading}>Let the night surprise you.</Text>
        <Text style={styles.heroBody}>We match your mood, budget and location with a restaurant worth waiting for.</Text>
      </View>
      <Card>
        <View style={styles.row}><View style={styles.rowIcon}><Sparkles color={colors.gold} size={16} strokeWidth={1.9} /></View><Text style={styles.cardTitle}>More ways to explore</Text></View>
        <Body muted>Curated moods and restaurant discoveries will appear here.</Body>
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
});
