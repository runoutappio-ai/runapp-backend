import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Star } from 'lucide-react-native';
import { Body, Button, Card, Field, InlineError } from '@/components/ui';
import { useSubmitFeedback } from '@/features/reservations/api';
import { colors, spacing } from '@/theme/tokens';

export const FEEDBACK_PROMPTS = [
  'We know it was great. Every Run Out restaurant is carefully selected and trusted.',
  'A good surprise tastes even better when the place has earned our trust.',
  'We only send you somewhere we would be happy to visit ourselves.',
  'Great restaurants, no guesswork. That is the Run Out promise.',
  "Your table was a mystery, but the restaurant's quality never is.",
  'The address stayed secret. Our confidence in the restaurant did not.',
  'Every Run Out restaurant is chosen to make the reveal worth the wait.',
  'Surprise should be exciting, never risky. That is why we choose trusted places.',
  'We did the restaurant research so you could simply enjoy the night.',
  'Another trusted table, another story worth telling.',
] as const;

export function FeedbackForm({ reservationId }: { reservationId: string }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [wouldReturn, setWouldReturn] = useState(false);
  const promptIndex = [...reservationId].reduce((sum, character) => sum + character.charCodeAt(0), 0) % FEEDBACK_PROMPTS.length;
  const prompt = FEEDBACK_PROMPTS[promptIndex];
  const mutation = useSubmitFeedback(reservationId);
  return (
    <Card>
      <Text style={styles.title}>How was your night?</Text><Body muted>{prompt}</Body>
      <View accessibilityRole="radiogroup" style={styles.stars}>{[1, 2, 3, 4, 5].map((value) => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: rating === value }} accessibilityLabel={`${value} star${value === 1 ? '' : 's'}`} onPress={() => setRating(value)}><Star size={30} strokeWidth={1.6} color={colors.gold} fill={value <= rating ? colors.gold : 'transparent'} /></Pressable>)}</View>
      <Field label="Tell us more (optional)" value={comment} onChangeText={setComment} multiline maxLength={1000} />
      <View style={styles.returnRow}><Text style={styles.returnCopy}>Would you come back to this restaurant for another surprise menu and keep exploring what it has to offer?</Text><Switch value={wouldReturn} onValueChange={setWouldReturn} trackColor={{ true: colors.gold, false: colors.selectedBorder }} thumbColor={colors.text} /></View>
      {mutation.error ? <InlineError message={mutation.error.message} /> : null}
      <Button disabled={!rating} loading={mutation.isPending} onPress={() => mutation.mutate({ rating, comment: comment.trim() || null, wouldReturnForSurpriseMenu: wouldReturn })}>Submit feedback</Button>
    </Card>
  );
}
const styles = StyleSheet.create({ title: { color: colors.text, fontSize: 17, fontWeight: '700' }, stars: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm }, returnRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' }, returnCopy: { flex: 1, color: colors.textSoft, fontSize: 13, lineHeight: 19 } });
