import { useState } from 'react';
import { type LayoutChangeEvent, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { LockKeyhole, MailOpen, UserPlus, UsersRound } from 'lucide-react-native';
import { colors, radius } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

const SERIF_ITALIC = Platform.select({ ios: 'Didot-Italic', android: 'serif', default: 'Georgia, serif' });
// Real envelope proportions (≈ 1.55 : 1), kept small so the card stays compact.
const ENVELOPE_HEIGHT = 98;
const ENVELOPE_WIDTH = 152;
const FLAP_RATIO = 0.38;

type Props = {
  /** Countdown text ("1d 21h 22m"). When absent the card shows `phrase` instead. */
  countdown?: string;
  when?: string;
  partySize?: number;
  phrase: string;
  onInvite?: () => void;
  /** Opens the envelope (Home shows the expanding envelope with the countdown). */
  onOpen?: () => void;
};

/**
 * Home's top card: a closed wine envelope (left) with the next reveal written on it,
 * sealed with the RO wax seal, and the Invite action beside it.
 */
export function RevealEnvelopeCard({ countdown, when, partySize, phrase, onInvite, onOpen }: Props) {
  const { colors: themeColors } = useTheme();
  const [width, setWidth] = useState(0);
  const flap = Math.round(ENVELOPE_HEIGHT * FLAP_RATIO);
  const onLayout = (event: LayoutChangeEvent) => setWidth(Math.round(event.nativeEvent.layout.width));
  const sealed = Boolean(countdown);

  return (
    <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: sealed ? 'rgba(235, 196, 108, 0.28)' : themeColors.line }]}>
      <View
        onLayout={onLayout}
        style={styles.envelope}
        accessible
        accessibilityLabel={sealed ? `Sealed envelope. Next reveal in ${countdown}. ${when ?? ''}` : phrase}>
        <View pointerEvents="none" style={styles.sheen} />
        <View pointerEvents="none" style={styles.innerLine} />
        {width > 0 ? (
          <>
            {/* darker hairline under the flap, then the flap itself */}
            <View pointerEvents="none" style={[styles.flap, { borderLeftWidth: width / 2, borderRightWidth: width / 2, borderTopWidth: flap + 1.5, borderTopColor: '#CDB27A' }]} />
            <View pointerEvents="none" style={[styles.flap, { borderLeftWidth: width / 2, borderRightWidth: width / 2, borderTopWidth: flap, borderTopColor: '#EADCBE' }]} />
            <View pointerEvents="none" style={[styles.seal, { top: flap - 10, left: width / 2 - 10 }]}>
              <Text style={styles.sealR}>R</Text><Text style={styles.sealO}>O</Text>
            </View>
          </>
        ) : null}
        <View style={[styles.writing, { paddingTop: flap + 8 }]}>
          <Text style={styles.label}>{sealed ? 'NEXT REVEAL IN' : 'YOUR NEXT NIGHT'}</Text>
          <Text numberOfLines={sealed ? 1 : 2} style={sealed ? styles.countdown : styles.phrase}>{sealed ? countdown : phrase}</Text>
          {sealed && when ? <Text numberOfLines={1} style={styles.when}>{when}</Text> : null}
        </View>
      </View>

      <View style={styles.side}>
        {sealed ? (
          <View style={styles.facts}>
            {partySize ? <View style={styles.fact}><UsersRound color={themeColors.gold} size={13} strokeWidth={2} /><Text style={[styles.factText, { color: themeColors.textSoft }]}>{partySize} guests</Text></View> : null}
            <View style={styles.fact}><LockKeyhole color={themeColors.gold} size={13} strokeWidth={2} /><Text style={[styles.factText, { color: themeColors.textSoft }]}>Sealed</Text></View>
          </View>
        ) : <View />}
        <View style={styles.actions}>
          {onInvite ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Invite guests to this reservation" onPress={onInvite} style={({ pressed }) => [styles.invite, pressed && styles.pressed]}>
              <UserPlus color={colors.primaryText} size={14} strokeWidth={2.4} />
              <Text style={styles.inviteText}>Invite</Text>
            </Pressable>
          ) : null}
          {sealed && onOpen ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Open the envelope" onPress={onOpen} style={({ pressed }) => [styles.invite, pressed && styles.pressed]}>
              <MailOpen color={colors.primaryText} size={14} strokeWidth={2.2} />
              <Text style={styles.inviteText}>Open</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 9, borderRadius: 18, borderWidth: 1 },
  envelope: { width: ENVELOPE_WIDTH, height: ENVELOPE_HEIGHT, borderRadius: 8, backgroundColor: '#F4EBD8', borderWidth: 1, borderColor: '#D9C49A', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  sheen: { position: 'absolute', left: -30, bottom: -60, width: 160, height: 120, borderRadius: 80, backgroundColor: '#FBF6EA', opacity: 0.55 },
  innerLine: { position: 'absolute', left: 4, right: 4, bottom: 4, top: 4, borderRadius: 5, borderWidth: StyleSheet.hairlineWidth, borderColor: '#D9C49A' },
  flap: { position: 'absolute', top: 0, left: 0, width: 0, height: 0, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  seal: { position: 'absolute', width: 20, height: 20, borderRadius: 10, backgroundColor: '#7A2842', borderWidth: 2, borderColor: '#5C1B30', flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', paddingTop: 2, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  sealR: { color: '#EBC46C', fontFamily: SERIF_ITALIC, fontStyle: 'italic', fontSize: 9.5, fontWeight: '600' },
  sealO: { color: '#EBC46C', fontFamily: SERIF_ITALIC, fontStyle: 'italic', fontSize: 7, fontWeight: '600', marginLeft: -1 },
  writing: { flex: 1, paddingHorizontal: 6, paddingBottom: 6, justifyContent: 'center', alignItems: 'center', gap: 1 },
  label: { color: '#8A6A3A', fontSize: 7, fontWeight: '800', letterSpacing: 1.4 },
  countdown: { color: '#2B1A12', fontSize: 16, lineHeight: 19, fontWeight: '800', letterSpacing: -0.6 },
  phrase: { color: '#2B1A12', fontSize: 10.5, lineHeight: 13, fontWeight: '700', textAlign: 'center' },
  when: { color: '#6E4E2A', fontFamily: SERIF_ITALIC, fontStyle: 'italic', fontSize: 9.5 },
  side: { flex: 1, alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  actions: { alignItems: 'stretch', gap: 6 },
  invite: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, height: 30, paddingHorizontal: 13, borderRadius: radius.pill, backgroundColor: colors.gold },
  inviteText: { color: colors.primaryText, fontSize: 12, fontWeight: '800' },
  pressed: { opacity: 0.85 },
  facts: { gap: 6, alignSelf: 'flex-end' },
  fact: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  factText: { fontSize: 11.5, fontWeight: '600' },
});
