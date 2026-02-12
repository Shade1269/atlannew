/**
 * بناء لوحة ألوان صالة العرض الفاخر من إعدادات ثيم المتجر (من get_store_theme_config أو affiliate_stores.theme).
 * يحافظ على نفس هيكل ThemeColors مع تطبيق ألوان المتجر فقط (لا شيء ثابت).
 */

import type { ThemeColors } from '@/components/storefront/luxury/LuxuryThemeContext';

export type ThemeMode = 'dark' | 'light';

/** ألوان الثيم من قاعدة البيانات (ثلاثيات HSL بدون hsl()) */
export interface StoreThemeColors {
  primary?: string;
  secondary?: string;
  accent?: string;
  background?: string;
  foreground?: string;
  muted?: string;
  'muted-foreground'?: string;
  card?: string;
  'card-foreground'?: string;
  border?: string;
  [key: string]: string | undefined;
}

/** تحويل ثلاثية HSL "H S% L%" إلى "hsl(H, S%, L%)" */
function toHsl(triplet: string | undefined): string {
  if (!triplet || typeof triplet !== 'string') return '';
  const t = triplet.trim().replace(/\s*,\s*/g, ' ');
  if (!t) return '';
  if (t.startsWith('hsl(')) return t;
  return `hsl(${t.replace(/\s+/g, ', ')})`;
}

/** تحويل ثلاثية إلى hsla مع شفافية */
function toHsla(triplet: string | undefined, alpha: number): string {
  const hsl = toHsl(triplet);
  if (!hsl) return '';
  return hsl.replace('hsl(', 'hsla(').replace(')', `, ${alpha})`);
}

/**
 * بناء لوحة ألوان كاملة بنفس هيكل صالة العرض الفاخر، مع استخدام ألوان المتجر فقط.
 * الوضع الداكن/الفاتح يُستنتج من luminance الخلفية أو يُمرَّر من themeMode.
 */
export function buildLuxuryPaletteFromStoreTheme(
  storeTheme: { colors?: StoreThemeColors } | StoreThemeColors | null | undefined,
  mode: ThemeMode
): ThemeColors {
  const colorsSource: StoreThemeColors =
    storeTheme && typeof storeTheme === 'object' && 'colors' in storeTheme
      ? (storeTheme.colors as StoreThemeColors) || {}
      : (storeTheme as StoreThemeColors) || {};

  const bg = mode === 'light' ? '0 0% 100%' : (colorsSource.background ?? '20 14% 4%');
  const fg = colorsSource.foreground ?? colorsSource['muted-foreground'] ?? (mode === 'dark' ? '45 30% 96%' : '222 47% 11%');
  const primary = colorsSource.primary ?? (mode === 'dark' ? '45 100% 51%' : '25 85% 35%');
  const accent = colorsSource.accent ?? primary;
  const muted = colorsSource.muted ?? (mode === 'dark' ? '20 10% 11%' : '210 40% 96%');
  const mutedFg = colorsSource['muted-foreground'] ?? (mode === 'dark' ? '35 15% 55%' : '215 16% 47%');
  const border = colorsSource.border ?? (mode === 'dark' ? '40 25% 35%' : '214 32% 91%');

  const bgHsl = toHsl(bg);
  const bgSecondary = mode === 'dark' ? 'hsl(20, 12%, 7%)' : 'hsl(210, 40%, 96%)';
  const bgTertiary = toHsl(muted);
  const bgCard = mode === 'dark' ? 'hsla(20, 14%, 9%, 0.95)' : 'hsla(0, 0%, 100%, 0.95)';
  const bgInput = mode === 'dark' ? 'hsl(20, 12%, 8%)' : 'hsl(0, 0%, 100%)';
  const bgOverlay = mode === 'dark' ? 'hsla(20, 14%, 3%, 0.97)' : 'hsla(0, 0%, 100%, 0.98)';

  const textHsl = toHsl(fg);
  const textSecondary = mode === 'dark' ? 'hsl(40, 20%, 78%)' : 'hsl(215, 16%, 35%)';
  const textMuted = toHsl(mutedFg);
  const textInverse = mode === 'dark' ? 'hsl(20, 30%, 10%)' : 'hsl(0, 0%, 96%)';

  const primaryHsl = toHsl(primary);
  const primaryHover = mode === 'dark' ? 'hsl(45, 100%, 58%)' : 'hsl(25, 85%, 40%)';
  const primaryText = mode === 'dark' ? 'hsl(20, 30%, 8%)' : 'hsl(0, 0%, 100%)';
  const accentHsl = toHsl(accent);

  const gradientSection =
    mode === 'dark'
      ? `linear-gradient(180deg, ${bgHsl || 'hsl(20, 14%, 4%)'} 0%, hsl(25, 18%, 8%) 50%, ${bgHsl || 'hsl(20, 14%, 4%)'} 100%)`
      : `linear-gradient(180deg, ${bgHsl || '#ffffff'} 0%, hsl(210, 40%, 98%) 50%, ${bgHsl || '#ffffff'} 100%)`;
  const gradientGold = `linear-gradient(135deg, ${primaryHsl}, ${accentHsl})`;
  const bgHslAlpha = (alpha: number) =>
    bgHsl ? (bgHsl.startsWith('hsl(') ? `hsla(${bgHsl.slice(4, -1)}, ${alpha})` : bgHsl) : '';
  const gradientHero =
    mode === 'dark'
      ? `linear-gradient(90deg, ${bgHslAlpha(0.95) || 'hsla(20, 14%, 4%, 0.95)'} 0%, ${bgHslAlpha(0.6) || 'hsla(20, 14%, 4%, 0.6)'} 40%, transparent 70%)`
      : `linear-gradient(90deg, ${bgHslAlpha(0.98) || 'hsla(0, 0%, 100%, 0.98)'} 0%, ${bgHslAlpha(0.7) || 'hsla(0, 0%, 100%, 0.7)'} 40%, transparent 70%)`;

  return {
    background: bgHsl || (mode === 'dark' ? 'hsl(20, 14%, 4%)' : '#ffffff'),
    backgroundSecondary: bgSecondary,
    backgroundTertiary: toHsl(muted) || bgTertiary,
    backgroundCard: bgCard,
    backgroundInput: bgInput,
    backgroundOverlay: bgOverlay,
    text: textHsl || (mode === 'dark' ? 'hsl(45, 30%, 96%)' : 'hsl(222, 47%, 11%)'),
    textSecondary,
    textMuted,
    textInverse,
    primary: primaryHsl || (mode === 'dark' ? 'hsl(45, 100%, 51%)' : 'hsl(25, 85%, 35%)'),
    primaryHover,
    primaryText,
    primaryGradient: gradientGold,
    accent: accentHsl || primaryHsl,
    accentMuted: toHsla(accent, 0.15),
    accentLight: mode === 'dark' ? 'hsl(45, 85%, 65%)' : 'hsl(40, 85%, 50%)',
    accentGlow: toHsla(accent, 0.4) || toHsla(primary, 0.4),
    border: toHsla(border, 0.2) || (mode === 'dark' ? 'hsla(40, 30%, 40%, 0.2)' : 'hsla(20, 20%, 60%, 0.2)'),
    borderHover: toHsla(primary, 0.4),
    borderInput: toHsla(border, 0.3),
    borderAccent: toHsla(accent, 0.5),
    shadow: mode === 'dark' ? 'hsla(0, 0%, 0%, 0.5)' : 'hsla(20, 30%, 20%, 0.08)',
    shadowPrimary: toHsla(primary, 0.25),
    shadowLarge: mode === 'dark' ? '0 25px 50px -12px hsla(0, 0%, 0%, 0.5)' : '0 25px 50px -12px hsla(20, 30%, 20%, 0.15)',
    gradientHero,
    gradientSection,
    gradientOverlay:
      mode === 'dark'
        ? 'linear-gradient(180deg, transparent 0%, hsla(20, 14%, 4%, 0.7) 50%, hsla(20, 14%, 4%, 0.98) 100%)'
        : 'linear-gradient(180deg, transparent 0%, hsla(0, 0%, 100%, 0.7) 50%, hsla(0, 0%, 100%, 0.98) 100%)',
    gradientCard: mode === 'dark' ? 'linear-gradient(145deg, hsl(20, 12%, 9%), hsl(20, 14%, 6%))' : 'linear-gradient(145deg, hsl(0, 0%, 100%), hsl(210, 40%, 98%))',
    gradientPromo: mode === 'dark' ? 'linear-gradient(135deg, hsl(25, 30%, 12%) 0%, hsl(20, 25%, 8%) 100%)' : 'linear-gradient(135deg, hsl(210, 40%, 97%) 0%, hsl(210, 35%, 95%) 100%)',
    gradientGold,
    buttonPrimary: gradientGold,
    buttonSecondary: mode === 'dark' ? 'hsla(40, 20%, 25%, 0.4)' : 'hsla(20, 20%, 85%, 0.5)',
    buttonDanger: mode === 'dark' ? 'hsla(0, 70%, 55%, 0.2)' : 'hsla(0, 60%, 55%, 0.12)',
    buttonText: primaryText,
    success: mode === 'dark' ? 'hsl(152, 70%, 50%)' : 'hsl(152, 65%, 38%)',
    successBg: mode === 'dark' ? 'hsla(152, 70%, 50%, 0.15)' : 'hsla(152, 65%, 38%, 0.1)',
    error: mode === 'dark' ? 'hsl(0, 80%, 60%)' : 'hsl(0, 75%, 50%)',
    errorBg: mode === 'dark' ? 'hsla(0, 80%, 60%, 0.15)' : 'hsla(0, 75%, 50%, 0.1)',
    warning: mode === 'dark' ? 'hsl(45, 95%, 55%)' : 'hsl(35, 90%, 45%)',
    warningBg: mode === 'dark' ? 'hsla(45, 95%, 55%, 0.15)' : 'hsla(35, 90%, 45%, 0.1)',
    info: mode === 'dark' ? 'hsl(210, 80%, 60%)' : 'hsl(210, 75%, 50%)',
    infoBg: mode === 'dark' ? 'hsla(210, 80%, 60%, 0.15)' : 'hsla(210, 75%, 50%, 0.1)',
    headerBg: mode === 'dark' ? 'hsla(20, 14%, 4%, 0.97)' : 'hsla(0, 0%, 100%, 0.98)',
    headerBgScrolled: mode === 'dark' ? 'hsla(20, 14%, 5%, 0.98)' : 'hsla(0, 0%, 100%, 0.99)',
    topBarBg: primaryHsl || (mode === 'dark' ? 'hsl(45, 100%, 51%)' : 'hsl(25, 85%, 35%)'),
    topBarText: primaryText,
    footerBg: mode === 'dark' ? 'linear-gradient(180deg, hsl(20, 14%, 4%) 0%, hsl(20, 16%, 3%) 100%)' : 'linear-gradient(180deg, hsl(210, 20%, 96%) 0%, hsl(210, 15%, 94%) 100%)',
    footerFeaturesBg: mode === 'dark' ? 'hsla(40, 40%, 20%, 0.15)' : 'hsla(210, 20%, 90%, 0.4)',
  };
}
