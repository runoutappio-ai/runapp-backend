import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Mail, Send, UsersRound } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body, Button, Card, Eyebrow, Field, InlineError, Segmented, Title, TopGlow } from '@/components/ui';
import { AppTabBar } from '@/components/AppTabBar';
import { useReservation } from '@/features/reservations/api';
import { colors, spacing } from '@/theme/tokens';

type Channel = 'email' | 'whatsapp';
type Invitee = { name: string; destination: string; channel: Channel };

const CHANNELS: { key: Channel; label: string }[] = [
  { key: 'email', label: 'Email' },
  { key: 'whatsapp', label: 'WhatsApp' },
];

export default function InviteScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const reservation = useReservation(id);
  const [inviteeValues, setInviteeValues] = useState<Invitee[]>([]);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const requiredCount = Math.max(0, (reservation.data?.partySize ?? 1) - 1);
  const visibleCount = Math.min(requiredCount, Math.max(0, inviteeValues.length || (requiredCount ? 1 : 0)));
  const invitees = useMemo(() => Array.from({ length: visibleCount }, (_, index) => inviteeValues[index] ?? { name: '', destination: '', channel: 'email' as Channel }), [inviteeValues, visibleCount]);

  const updateInvitee = (index: number, value: Partial<Invitee>) => setInviteeValues((current) => { const next = Array.from({ length: Math.max(visibleCount, index + 1) }, (_, itemIndex) => current[itemIndex] ?? { name: '', destination: '', channel: 'email' }); next[index] = { ...next[index], ...value }; return next; });
  const addInvitee = () => setInviteeValues((current) => current.length < requiredCount ? [...current, { name: '', destination: '', channel: 'email' }] : current);

  const sendInvitations = async () => {
    const incomplete = invitees.findIndex((invitee) => !invitee.name.trim() || !invitee.destination.trim());
    if (incomplete >= 0) {
      setError(`Add a name and ${invitees[incomplete].channel === 'email' ? 'email address' : 'WhatsApp number'} for guest ${incomplete + 1}.`);
      return;
    }
    setError('');
    setSending(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    setSending(false);
    setSent(true);
    Alert.alert('Invitations ready', `Demo invitations prepared for ${invitees.length} guest${invitees.length === 1 ? '' : 's'}.`);
  };

  const when = useMemo(() => reservation.data ? new Intl.DateTimeFormat('en-AE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Dubai' }).format(new Date(reservation.data.reservationAt)) : '', [reservation.data]);

  return <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
    <TopGlow />
    <View style={styles.topBar}><Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}><ChevronLeft color={colors.text} size={22} /></Pressable><Text style={styles.topTitle}>Invite your table</Text><View style={styles.spacer} /></View>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Eyebrow>Bring your people</Eyebrow>
      <Title>Who’s joining you?</Title>
      {reservation.error ? <InlineError message={reservation.error.message} onRetry={() => void reservation.refetch()} /> : null}
      {reservation.data ? <>
        <Card style={styles.summary}><View style={styles.summaryIcon}><UsersRound color={colors.gold} size={20} /></View><View style={styles.summaryCopy}><Text style={styles.summaryTitle}>Table for {reservation.data.partySize}</Text><Body muted>{when} · AED {reservation.data.totalBudget.amount} total</Body></View></Card>
        <Text style={styles.helper}>You’re already included. Add up to {requiredCount} other guest{requiredCount === 1 ? '' : 's'} one at a time.</Text>
        <Text style={styles.counter}>{invitees.length} of {requiredCount} guest{requiredCount === 1 ? '' : 's'} added</Text>
        {invitees.map((invitee, index) => { const destinationLabel = invitee.channel === 'email' ? 'Email' : 'WhatsApp number'; const destinationPlaceholder = invitee.channel === 'email' ? 'friend@example.com' : '+971 50 123 4567'; return <Card key={index} style={styles.invitee}><Text style={styles.guestLabel}>Guest {index + 1}</Text><Segmented options={CHANNELS} value={invitee.channel} onChange={(channel) => { updateInvitee(index, { channel, destination: '' }); setSent(false); }} /><Field label="Name" value={invitee.name} onChangeText={(name) => updateInvitee(index, { name })} placeholder="Their name" autoCapitalize="words" style={styles.compactInput} /><Field label={destinationLabel} value={invitee.destination} onChangeText={(destination) => updateInvitee(index, { destination })} placeholder={destinationPlaceholder} autoCapitalize="none" keyboardType={invitee.channel === 'email' ? 'email-address' : 'phone-pad'} style={styles.compactInput} /></Card>; })}
        {invitees.length < requiredCount ? <Button variant="secondary" onPress={addInvitee}>+ Add another guest</Button> : null}
        {error ? <InlineError message={error} /> : null}
        {sent ? <View style={styles.sent}><Send color={colors.success} size={17} /><Text style={styles.sentText}>Demo invitations prepared. No messages were actually sent.</Text></View> : null}
        <Button disabled={!invitees.length} onPress={() => void sendInvitations()} loading={sending}><Send size={16} color={colors.primaryText} /> Prepare invitations</Button>
        <Text style={styles.footnote}><Mail size={12} color={colors.muted} /> Email and WhatsApp delivery are mocked for now. We can connect a provider when you’re ready.</Text>
      </> : <Body muted>Loading your reservation…</Body>}
    </ScrollView>
    <AppTabBar />
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: { height: 52, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  spacer: { width: 40 }, topTitle: { color: colors.text, fontSize: 15, fontWeight: '700' },
  content: { paddingHorizontal: 20, paddingTop: spacing.lg, paddingBottom: 150, gap: spacing.md },
  summary: { flexDirection: 'row', alignItems: 'center', gap: spacing.md }, summaryIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.accentSurface, alignItems: 'center', justifyContent: 'center' }, summaryCopy: { flex: 1, gap: 2 }, summaryTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  helper: { color: colors.muted, fontSize: 13, lineHeight: 18 }, counter: { color: colors.gold, fontSize: 11.5, fontWeight: '700' }, invitee: { gap: 6, padding: 12 }, guestLabel: { color: colors.gold, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }, compactInput: { minHeight: 42, fontSize: 14, paddingHorizontal: 12 },
  sent: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm }, sentText: { flex: 1, color: colors.success, fontSize: 13, lineHeight: 18 },
  footnote: { color: colors.muted, fontSize: 11.5, lineHeight: 17, textAlign: 'center' },
});
