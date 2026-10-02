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
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { colors, radius, spacing, type } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { AmbientBackground, GlassSurface, useGlassPill } from '@/components/Glass';

export { AmbientBackground, GlassSurface } from '@/components/Glass';

/** Ambient light behind the top of every main screen (blurred hero photo). Kept as TopGlow for existing imports. */
export function TopGlow() {
  return <AmbientBackground />;
}

export function Screen({ children, scroll = true, glow = true }: PropsWithChildren<{ scroll?: boolean; glow?: boolean }>) {
  const { colors: themeColors } = useTheme();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]} edges={['top', 'left', 'right']}>
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
  const { colors: themeColors } = useTheme();
  return <Text style={[styles.eyebrow, { color: themeColors.gold }]}>{children}</Text>;
}

export function Title({ children, size = 'large' }: PropsWithChildren<{ size?: 'large' | 'medium' }>) {
  const { colors: themeColors } = useTheme();
  return <Text style={[styles.title, { color: themeColors.text }, size === 'medium' && styles.titleMedium]}>{children}</Text>;
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
  const { colors: themeColors } = useTheme();
  return <Text style={[styles.body, { color: muted ? themeColors.muted : themeColors.text }]}>{children}</Text>;
}

export function Card({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  return <GlassSurface style={[styles.card, style]}>{children}</GlassSurface>;
}

/** Pill segmented control — glass track, brighter glass pill for the active option. */
export function Segmented<T extends string>({ options, value, onChange }: { options: { key: T; label: string }[]; value: T; onChange: (value: T) => void }) {
  const { colors: themeColors } = useTheme();
  const glassPill = useGlassPill();
  return (
    <View accessibilityRole="tablist" style={[styles.segmented, glassPill]}>
      {options.map(({ key, label }) => {
        const selected = value === key;
        return (
          <Pressable key={key} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => onChange(key)} style={[styles.segment, selected && { backgroundColor: themeColors.glassActive, borderColor: themeColors.glassActiveBorder }]}>
            <Text numberOfLines={1} style={[styles.segmentText, { color: themeColors.glassText }, selected && styles.segmentTextActive, selected && { color: themeColors.text }]}>{label}</Text>
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
  const { colors: themeColors } = useTheme();
  const glassPill = useGlassPill();
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
        variant === 'primary' ? { backgroundColor: themeColors.gold } : variant === 'secondary' ? glassPill : variant === 'danger' ? { borderColor: 'rgba(255, 140, 134, 0.4)' } : { borderColor: themeColors.glassBorder },
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
      ]}>
      {loading ? <ActivityIndicator color={variant === 'primary' ? themeColors.primaryText : themeColors.text} /> : <View style={styles.buttonContent}>{Children.map(children, (child) => typeof child === 'string' || typeof child === 'number' ? <Text numberOfLines={1} style={[styles.buttonText, { color: variant === 'primary' ? themeColors.primaryText : variant === 'danger' ? themeColors.danger : themeColors.text }, variant === 'primary' && styles.buttonTextPrimary]}>{child}</Text> : child)}</View>}
    </Pressable>
  );
}

export function Field({ label, error, ...props }: TextInputProps & { label: string; error?: string }) {
  const { colors: themeColors } = useTheme();
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { color: themeColors.goldSoft }]}>{label}</Text>
      <TextInput
        {...props}
        accessibilityLabel={props.accessibilityLabel ?? label}
        placeholderTextColor={themeColors.faint}
        selectionColor={colors.gold}
        style={[styles.input, { color: themeColors.text, backgroundColor: themeColors.glassTrack, borderColor: themeColors.glassBorder }, props.multiline && styles.multiline, error ? styles.inputError : undefined, props.style]}
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
  eyebrow: { color: colors.gold, fontFamily: Platform.select({ ios: 'Avenir Next', android: 'sans-serif', default: 'Avenir Next' }), ...type.eyebrow },
  title: { color: colors.text, fontFamily: Platform.select({ ios: 'Avenir Next', android: 'sans-serif', default: 'Avenir Next' }), ...type.title },
  titleMedium: { ...type.titleMedium },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs },
  section: { color: colors.text, ...type.section },
  body: { color: colors.text, fontFamily: Platform.select({ ios: 'Avenir Next', android: 'sans-serif', default: 'Avenir Next' }), ...type.body },
  muted: { color: colors.muted },
  card: { padding: 16, gap: spacing.sm },
  segmented: { flexDirection: 'row', gap: 4, padding: 5, borderRadius: radius.pill },
  segment: { flex: 1, minHeight: 40, paddingHorizontal: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: colors.selected, borderColor: colors.selectedBorder },
  segmentText: { color: colors.muted, fontSize: 13.5, fontWeight: '600' },
  segmentTextActive: { color: colors.text, fontWeight: '700' },
  monoDiamond: { transform: [{ rotate: '45deg' }], backgroundColor: colors.burgundy, borderWidth: 1, borderColor: colors.accentBorder, alignItems: 'center', justifyContent: 'center' },
  monoLetters: { flexDirection: 'row', alignItems: 'baseline', transform: [{ rotate: '-45deg' }] },
  monoR: { color: colors.gold, fontFamily: SERIF, fontStyle: 'italic', fontWeight: '600' },
  monoO: { color: colors.gold, fontFamily: SERIF, fontStyle: 'italic', fontWeight: '600', opacity: 0.9 },
  button: { minHeight: 46, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  button_primary: { backgroundColor: colors.gold },
  button_secondary: { borderWidth: 1 },
  button_ghost: { backgroundColor: 'transparent', borderWidth: 1 },
  button_danger: { backgroundColor: 'transparent', borderWidth: 1 },
  buttonText: { color: colors.text, fontFamily: Platform.select({ ios: 'Avenir Next', android: 'sans-serif-medium', default: 'Avenir Next' }), fontWeight: '700', fontSize: 14 },
  buttonTextPrimary: { color: colors.primaryText, fontWeight: '800' },
  buttonTextDanger: { color: colors.danger },
  buttonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  pressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.45 },
  fieldWrap: { gap: 6 },
  label: { color: colors.goldSoft, fontWeight: '600', fontSize: 12.5 },
  input: { minHeight: 44, borderWidth: 1, borderRadius: 12, color: colors.text, fontSize: 14.5, paddingHorizontal: 12 },
  multiline: { minHeight: 96, paddingTop: 12, textAlignVertical: 'top' },
  inputError: { borderColor: colors.red },
  error: { color: colors.danger, fontSize: 12.5, lineHeight: 17 },
  errorCard: { backgroundColor: 'rgba(50, 24, 35, 0.7)', borderColor: 'rgba(255, 140, 134, 0.25)' },
  center: { alignItems: 'center', paddingVertical: spacing.xl, gap: 6 },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  emptyBody: { color: colors.muted, fontSize: 13, lineHeight: 19, textAlign: 'center' },
});

/** Round glass "back" button; falls back to `fallback` when there is no screen to go back to (e.g. a web reload). */
export function BackButton({ fallback = '/(auth)', label = 'Go back' }: { fallback?: string; label?: string }) {
  const glassPill = useGlassPill();
  const { colors: themeColors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={() => (router.canGoBack() ? router.back() : router.replace(fallback as never))}
      style={({ pressed }) => [backStyles.button, glassPill, pressed && { opacity: 0.8 }]}>
      <ChevronLeft color={themeColors.text} size={22} />
    </Pressable>
  );
}

const backStyles = StyleSheet.create({
  button: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
});
