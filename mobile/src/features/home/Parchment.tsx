import { Platform, StyleSheet, Text, View } from 'react-native';
import type { Restaurant, RestaurantMenu } from '@/types/api';

const FONTS = {
  script: Platform.select({ ios: 'SnellRoundhand-Bold', android: 'cursive', default: 'cursive' }),
  display: Platform.select({ ios: 'Didot', android: 'serif', default: 'Georgia, serif' }),
  displayItalic: Platform.select({ ios: 'Didot-Italic', android: 'serif', default: 'Georgia, serif' }),
  body: Platform.select({ ios: 'Baskerville', android: 'serif', default: 'Georgia, serif' }),
  bodyItalic: Platform.select({ ios: 'Baskerville-Italic', android: 'serif', default: 'Georgia, serif' }),
};

const INK = '#2B1A12';
const SEPIA = '#6E4E2A';
const GOLD_LINE = '#C9A55A';

export function formatCuisine(value: string | null | undefined) {
  if (!value) return 'Curated cuisine';
  const words = value.replace(/_/g, ' ').toLowerCase().replace(/\brestaurant\b/g, '').trim().split(/\s+/);
  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'Curated cuisine';
}

function Ornament() {
  return (
    <View style={styles.ornament}>
      <View style={styles.ornamentLine} />
      <View style={styles.ornamentDiamond} />
      <View style={styles.ornamentLine} />
    </View>
  );
}

function Corner({ style }: { style: object }) {
  return <View style={[styles.corner, style]} />;
}

/** A modern parchment card: restaurant name in script, menu set in classic serif. */
export function Parchment({ restaurant, menu, menuSealed }: { restaurant: Restaurant; menu: RestaurantMenu[] | null; menuSealed: boolean }) {
  const entries = (menu ?? []).flatMap((item) => Object.entries(item.entries));
  return (
    <View style={styles.paper} accessibilityLabel={`${restaurant.name}. ${menuSealed ? 'Menu still sealed.' : `${entries.length} dishes on tonight's menu.`}`}>
      <View style={styles.sheen} />
      <View style={styles.frameOuter}>
        <View style={styles.frameInner}>
          <Corner style={styles.cornerTL} /><Corner style={styles.cornerTR} /><Corner style={styles.cornerBL} /><Corner style={styles.cornerBR} />
          <Text style={styles.kicker}>RUN OUT · PRIVATE TABLE</Text>
          <Text style={styles.name}>{restaurant.name}</Text>
          <Text style={styles.cuisine}>{formatCuisine(restaurant.cuisine)}</Text>
          {restaurant.formattedAddress ? <Text style={styles.address}>{restaurant.formattedAddress}</Text> : null}
          <Ornament />
          <Text style={styles.menuHeading}>{menuSealed ? 'The menu' : 'Tonight’s menu'}</Text>
          {menuSealed ? (
            <Text style={styles.sealedNote}>Still sealed — it will be written here when the time comes.</Text>
          ) : entries.length ? (
            <View style={styles.menu}>
              {entries.map(([name, description], index) => (
                <View key={`${name}-${index}`} style={styles.dish}>
                  {index > 0 ? <Text style={styles.dot}>·</Text> : null}
                  <Text style={styles.dishName}>{name}</Text>
                  {description ? <Text style={styles.dishDescription}>{description}</Text> : null}
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.sealedNote}>The kitchen is still writing tonight’s menu.</Text>
          )}
          <Ornament />
          <Text style={styles.signature}>Bon appétit</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  paper: { borderRadius: 6, backgroundColor: '#F3E9D2', padding: 10, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  sheen: { position: 'absolute', top: -120, left: -80, width: 360, height: 300, borderRadius: 180, backgroundColor: '#FBF5E8', opacity: 0.7 },
  frameOuter: { borderWidth: 1, borderColor: GOLD_LINE, borderRadius: 3, padding: 3 },
  frameInner: { borderWidth: StyleSheet.hairlineWidth, borderColor: GOLD_LINE, borderRadius: 2, paddingHorizontal: 22, paddingVertical: 26, alignItems: 'center', gap: 8 },
  corner: { position: 'absolute', width: 7, height: 7, backgroundColor: GOLD_LINE, transform: [{ rotate: '45deg' }] },
  cornerTL: { top: -4, left: -4 }, cornerTR: { top: -4, right: -4 }, cornerBL: { bottom: -4, left: -4 }, cornerBR: { bottom: -4, right: -4 },
  kicker: { color: '#8A6A3A', fontSize: 9, fontWeight: '700', letterSpacing: 3 },
  name: { color: '#3A1321', fontFamily: FONTS.script, fontSize: 36, lineHeight: 48, textAlign: 'center', marginTop: 4 },
  cuisine: { color: SEPIA, fontFamily: FONTS.displayItalic, fontStyle: 'italic', fontSize: 16, textAlign: 'center' },
  address: { color: '#7A6A55', fontFamily: FONTS.body, fontSize: 11.5, lineHeight: 16, textAlign: 'center', marginTop: 2 },
  ornament: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 8 },
  ornamentLine: { width: 56, height: StyleSheet.hairlineWidth, backgroundColor: GOLD_LINE },
  ornamentDiamond: { width: 6, height: 6, backgroundColor: GOLD_LINE, transform: [{ rotate: '45deg' }] },
  menuHeading: { color: INK, fontFamily: FONTS.displayItalic, fontStyle: 'italic', fontSize: 22 },
  menu: { alignItems: 'center', gap: 4, marginTop: 4 },
  dish: { alignItems: 'center', gap: 3, paddingVertical: 4 },
  dot: { color: GOLD_LINE, fontSize: 18, lineHeight: 18, marginBottom: 4 },
  dishName: { color: INK, fontFamily: FONTS.display, fontSize: 14, letterSpacing: 1.6, textTransform: 'uppercase', textAlign: 'center' },
  dishDescription: { color: '#6A5845', fontFamily: FONTS.bodyItalic, fontStyle: 'italic', fontSize: 13.5, lineHeight: 19, textAlign: 'center' },
  sealedNote: { color: '#6A5845', fontFamily: FONTS.bodyItalic, fontStyle: 'italic', fontSize: 13.5, lineHeight: 19, textAlign: 'center' },
  signature: { color: '#3A1321', fontFamily: FONTS.script, fontSize: 22, lineHeight: 30 },
});
