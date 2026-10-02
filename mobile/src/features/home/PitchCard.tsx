import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { GlassSurface } from '@/components/Glass';
import { useTheme } from '@/theme/ThemeProvider';

const SERIF = Platform.select({ ios: 'Didot', android: 'serif', default: 'Georgia, serif' });

/** Cheeky one-liners about what Run Out does (50); shown on Home when there is no sealed envelope yet. */
export const PITCH_LINES = [
  'We pick the restaurant. The chef picks the menu. You just pick an outfit.',
  'Decision fatigue? Never heard of her.',
  'You set the budget. We spend it better than you would.',
  'The restaurant is a secret until it’s time to go. Yes, even from you.',
  'Stop asking the group chat “where should we eat?”. Ask us.',
  'No menus to read. No reviews to scroll. No arguing.',
  'Your only job tonight: show up hungry and on time.',
  'Like a blind date, but the food always shows up.',
  'Tell us the mood. We’ll handle the drama.',
  'The envelope opens when you arrive. Patience is part of the menu.',
  'Picky eaters welcome. Allergies respected. Boring plans rejected.',
  'Trust issues? Perfect. We love a challenge.',
  'Half the fun is not knowing. The other half is dessert.',
  'Somewhere in Dubai, a chef is already plotting your dinner.',
  'Ten minutes choosing a restaurant? We do it in zero.',
  'You bring the appetite. We bring the plot twist.',
  'Spontaneity, but make it organised.',
  'We read the menus so you don’t have to.',
  'Your dinner, our plot. No spoilers.',
  'The only surprise you’ll actually enjoy this week.',
  'Indecisive? Same. That’s why we exist.',
  'You don’t choose the restaurant. The restaurant chooses you.',
  'Trust the envelope. The envelope knows.',
  '“Anywhere is fine” — finally, someone takes it literally.',
  'Fewer tabs open. More plates on the table.',
  'One tap, one budget, one mystery. Done.',
  'We’ve eaten in more places than your food blogger friend.',
  'Your comfort zone called. We let it go to voicemail.',
  'Same city, brand-new tables. Every single time.',
  'You’ll know where you’re going when you need to. Not a minute before.',
  'Let the chef cook. Literally.',
  'Dinner roulette, but every slot is a winner.',
  'No “what do you feel like?” conversations were harmed.',
  'Your budget, your mood, our secret.',
  'Plot twist: you’ll love the place you’d never have picked.',
  'Suspense pairs well with every course.',
  'Bring friends. Blame us if it’s too good.',
  'Your taste buds deserve a holiday. Book the trip.',
  'We do the research. You take the credit.',
  'The menu is chosen by people who actually cook. Wild, right?',
  'Less planning, more chewing.',
  'Forget the top-10 lists. We have a top-1.',
  'Show up. Sit down. Be surprised. Repeat.',
  'Mystery is the best seasoning. We use plenty.',
  'You’ve been to the same five places. We counted.',
  'Your next favourite restaurant is hiding. We found it.',
  'Peek early? Nope. The envelope has boundaries.',
  'Even we get excited when the envelope opens.',
  'Book tonight, brag tomorrow.',
  'Hungry for adventure? We’ve got a table for that.',
];

export function PitchCard() {
  const { colors } = useTheme();
  const [index, setIndex] = useState(() => Math.floor(Math.random() * PITCH_LINES.length));
  // A new line every 5 seconds, in random order (never the same one twice in a row).
  useEffect(() => {
    const id = setInterval(() => setIndex((value) => (value + 1 + Math.floor(Math.random() * (PITCH_LINES.length - 1))) % PITCH_LINES.length), 5_000);
    return () => clearInterval(id);
  }, []);

  return (
    <GlassSurface radius={18} style={styles.card}>
        <View style={styles.head}>
          <Text style={[styles.eyebrow, { color: colors.gold }]}>THE RUN OUT DEAL</Text>
        </View>
        <View style={styles.lineBox}>
          <Animated.Text key={index} entering={FadeIn.duration(450)} exiting={FadeOut.duration(250)} accessibilityLiveRegion="polite" style={[styles.line, { color: colors.text }]}>
            {PITCH_LINES[index]}
          </Animated.Text>
        </View>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 8 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { fontFamily: SERIF, fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  lineBox: { minHeight: 66, justifyContent: 'center' },
  line: { fontSize: 16.5, lineHeight: 22, fontWeight: '700', letterSpacing: -0.2 },
});
