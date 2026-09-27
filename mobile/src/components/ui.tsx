import { Children, type PropsWithChildren, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, type } from '@/theme/tokens';

/** Soft wine glow that sits behind the top of every main screen. */
export function TopGlow() {
  return <View pointerEvents="none" style={styles.topGlow} />;
}

export function Screen({ children, scroll = true, glow = true }: PropsWithChildren<{ scroll?: boolean; glow?: boolean }>) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {glow ? <TopGlow /> : null}
      {scroll ? (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={styles.content}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Eyebrow({ children }: PropsWithChildren) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

export function Title({ children, size = 'large' }: PropsWithChildren<{ size?: 'large' | 'medium' }>) {
  return <Text style={[styles.title, size === 'medium' && styles.titleMedium]}>{children}</Text>;
}

export function SectionTitle({ children, action }: PropsWithChildren<{ action?: ReactNode }>) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.section}>{children}</Text>
      {action}
    </View>
  );
}

export function Body({ children, muted = false }: PropsWithChildren<{ muted?: boolean }>) {
  return <Text style={[styles.body, muted && styles.muted]}>{children}</Text>;
}

export function Card({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Pill segmented control — dark track, raised active pill. */
export function Segmented<T extends string>({ options, value, onChange }: { options: { key: T; label: string }[]; value: T; onChange: (value: T) => void }) {
  return (
    <View accessibilityRole="tablist" style={styles.segmented}>
      {options.map(({ key, label }) => {
        const selected = value === key;
        return (
          <Pressable key={key} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => onChange(key)} style={[styles.segment, selected && styles.segmentActive]}>
            <Text numberOfLines={1} style={[styles.segmentText, selected && styles.segmentTextActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' });

/** The Run Out "RO" monogram inside a wine diamond. */
export function Monogram({ size = 58 }: { size?: number }) {
  return <Image accessibilityLabel="Run Out official logo" source={require('../../assets/runout-official-logo.png')} style={{ width: size, height: size, borderRadius: size * 0.28 }} resizeMode="contain" />;
}

export function Button({
  children,
  onPress,
  disabled,
  variant = 'primary',
  loading,
  accessibilityLabel,
}: PropsWithChildren<{
  onPress?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  accessibilityLabel?: string;
}>) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[`button_${variant}`],
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
      ]}>
      {loading ? <ActivityIndicator color={variant === 'primary' ? colors.primaryText : colors.text} /> : <View style={styles.buttonContent}>{Children.map(children, (child) => typeof child === 'string' || typeof child === 'number' ? <Text style={[styles.buttonText, variant === 'primary' && styles.buttonTextPrimary, variant === 'danger' && styles.buttonTextDanger]}>{child}</Text> : child)}</View>}
    </Pressable>
  );
}

export function Field({ label, error, ...props }: TextInputProps & { label: string; error?: string }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        accessibilityLabel={props.accessibilityLabel ?? label}
        placeholderTextColor={colors.faint}
        selectionColor={colors.gold}
        style={[styles.input, props.multiline && styles.multiline, error ? styles.inputError : undefined, props.style]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export function InlineError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card style={styles.errorCard}>
      <Text accessibilityRole="alert" style={styles.error}>{message}</Text>
      {onRetry ? <Button variant="ghost" onPress={onRetry}>Try again</Button> : null}
    </Card>
  );
}

export function EmptyState({ title, message, action }: { title: string; message: string; action?: ReactNode }) {
  return (
    <Card style={styles.center}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{message}</Text>
      {action}
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topGlow: { position: 'absolute', top: -140, left: -120, width: 420, height: 360, borderRadius: 210, backgroundColor: '#34141F', opacity: 0.45 },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: spacing.lg, paddingBottom: 128, gap: spacing.md },
  eyebrow: { color: colors.gold, ...type.eyebrow },
  title: { color: colors.text, ...type.title },
  titleMedium: { ...type.titleMedium },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs },
  section: { color: colors.text, ...type.section },
  body: { color: colors.text, ...type.body },
  muted: { color: colors.muted },
  card: { backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: radius.card, padding: 18, gap: spacing.sm },
  segmented: { flexDirection: 'row', gap: 4, padding: 5, borderRadius: radius.pill, backgroundColor: colors.surfaceSunken, borderWidth: 1, borderColor: '#2A2527' },
  segment: { flex: 1, minHeight: 40, paddingHorizontal: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: colors.selected, borderColor: colors.selectedBorder },
  segmentText: { color: colors.muted, fontSize: 13.5, fontWeight: '600' },
  segmentTextActive: { color: colors.text, fontWeight: '700' },
  monoDiamond: { transform: [{ rotate: '45deg' }], backgroundColor: colors.burgundy, borderWidth: 1, borderColor: colors.accentBorder, alignItems: 'center', justifyContent: 'center' },
  monoLetters: { flexDirection: 'row', alignItems: 'baseline', transform: [{ rotate: '-45deg' }] },
  monoR: { color: colors.gold, fontFamily: SERIF, fontStyle: 'italic', fontWeight: '600' },
  monoO: { color: colors.gold, fontFamily: SERIF, fontStyle: 'italic', fontWeight: '600', opacity: 0.9 },
  button: { minHeight: 46, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  button_primary: { backgroundColor: colors.gold },
  button_secondary: { backgroundColor: colors.selected, borderWidth: 1, borderColor: colors.selectedBorder },
  button_ghost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.selectedBorder },
  button_danger: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#5A2A33' },
  buttonText: { color: colors.text, fontWeight: '700', fontSize: 14 },
  buttonTextPrimary: { color: colors.primaryText, fontWeight: '800' },
  buttonTextDanger: { color: colors.danger },
  buttonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  pressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.45 },
  fieldWrap: { gap: 6 },
  label: { color: colors.goldSoft, fontWeight: '600', fontSize: 12.5 },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, backgroundColor: colors.surface, color: colors.text, fontSize: 15, paddingHorizontal: 14 },
  multiline: { minHeight: 96, paddingTop: 12, textAlignVertical: 'top' },
  inputError: { borderColor: colors.red },
  error: { color: colors.danger, fontSize: 12.5, lineHeight: 17 },
  errorCard: { backgroundColor: colors.dangerSurface, borderColor: '#4A2230' },
  center: { alignItems: 'center', paddingVertical: spacing.xl, gap: 6 },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  emptyBody: { color: colors.muted, fontSize: 13, lineHeight: 19, textAlign: 'center' },
});
