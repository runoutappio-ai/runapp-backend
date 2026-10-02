import { Platform } from 'react-native';

/**
 * Web only: the app asks for "Avenir Next", which exists on Apple devices but not on
 * Windows/Android/Linux browsers (they would fall back to a serif). These @font-face
 * aliases map the name to the best local sans-serif per weight, so the web demo keeps
 * a clean sans everywhere while Macs/iPhones still get real Avenir Next.
 */
const WEIGHTS: [number, string[]][] = [
  [400, ['Avenir Next', 'AvenirNext-Regular', 'Segoe UI', 'SegoeUI', 'Roboto', 'Roboto-Regular', 'Helvetica Neue', 'Arial', 'Noto Sans', 'DejaVu Sans', 'Liberation Sans']],
  [500, ['AvenirNext-Medium', 'Segoe UI Semibold', 'SegoeUI-Semibold', 'Roboto Medium', 'Roboto-Medium', 'HelveticaNeue-Medium', 'Arial']],
  [600, ['AvenirNext-DemiBold', 'Segoe UI Semibold', 'SegoeUI-Semibold', 'Roboto Medium', 'Roboto-Medium', 'HelveticaNeue-Medium', 'Arial Bold']],
  [700, ['AvenirNext-Bold', 'Segoe UI Bold', 'SegoeUI-Bold', 'Roboto Bold', 'Roboto-Bold', 'HelveticaNeue-Bold', 'Arial Bold', 'Arial-BoldMT', 'Noto Sans Bold', 'DejaVu Sans Bold', 'Liberation Sans Bold']],
  [800, ['AvenirNext-Heavy', 'AvenirNext-Bold', 'Segoe UI Black', 'Roboto Black', 'Roboto-Black', 'Arial Black', 'Segoe UI Bold', 'Roboto Bold', 'Arial Bold', 'Noto Sans Bold', 'DejaVu Sans Bold', 'Liberation Sans Bold']],
];

export function installWebFontFallbacks() {
  if (Platform.OS !== 'web' || typeof document === 'undefined' || document.getElementById('runout-web-fonts')) return;
  const css = WEIGHTS.map(([weight, names]) => `@font-face{font-family:'Avenir Next';font-weight:${weight};src:${names.map((n) => `local('${n}')`).join(',')};}`).join('\n');
  const style = document.createElement('style');
  style.id = 'runout-web-fonts';
  style.textContent = `${css}\nhtml,body{background:#050405;}`;
  document.head.appendChild(style);
}
