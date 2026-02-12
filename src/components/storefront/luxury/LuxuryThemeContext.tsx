import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';

export type ThemeMode = 'dark' | 'light';

/**
 * نظام ألوان مبني على أعلى معايير التباين والقابلية للقراءة
 * مستوحى من Material Design 3، Apple Human Interface Guidelines، و Tailwind UI
 * 
 * القواعد الذهبية:
 * - الوضع الداكن: خلفيات داكنة جداً + نصوص فاتحة جداً (تباين 15:1+)
 * - الوضع الفاتح: خلفيات فاتحة جداً + نصوص داكنة جداً (تباين 15:1+)
 * - الألوان الرئيسية متوسطة التشبع لتعمل في كلا الوضعين
 */
export const themeColors = {
  dark: {
    // الخلفيات - داكنة جداً للتباين العالي
    background: 'hsl(20, 14%, 4%)',           // أسود دافئ عميق
    backgroundSecondary: 'hsl(20, 12%, 7%)',  // رمادي داكن جداً
    backgroundTertiary: 'hsl(20, 10%, 11%)',  // رمادي داكن
    backgroundCard: 'hsla(20, 14%, 9%, 0.95)', // كروت شفافة قليلاً
    backgroundInput: 'hsl(20, 12%, 8%)',       // حقول الإدخال
    backgroundOverlay: 'hsla(20, 14%, 3%, 0.97)', // التراكبات
    
    // النصوص - فاتحة جداً للقراءة الممتازة
    text: 'hsl(45, 30%, 96%)',           // أبيض كريمي دافئ (النص الرئيسي)
    textSecondary: 'hsl(40, 20%, 78%)',  // رمادي فاتح دافئ
    textMuted: 'hsl(35, 15%, 55%)',      // رمادي متوسط للنصوص الثانوية
    textInverse: 'hsl(20, 30%, 10%)',    // للنصوص على خلفيات فاتحة
    
    // الألوان الرئيسية - ذهبي فاخر
    primary: 'hsl(45, 100%, 51%)',        // ذهبي ساطع
    primaryHover: 'hsl(45, 100%, 58%)',   // ذهبي أفتح للهوفر
    primaryText: 'hsl(20, 30%, 8%)',      // نص داكن على الذهبي
    primaryGradient: 'linear-gradient(135deg, hsl(45, 100%, 51%), hsl(38, 95%, 55%))',
    
    // الأكسنت - درجات ذهبية
    accent: 'hsl(40, 90%, 55%)',
    accentMuted: 'hsla(40, 60%, 50%, 0.15)',
    accentLight: 'hsl(45, 85%, 65%)',
    accentGlow: 'hsla(45, 100%, 50%, 0.4)',
    
    // الحدود - دقيقة ومرئية
    border: 'hsla(40, 30%, 40%, 0.2)',
    borderHover: 'hsla(45, 60%, 55%, 0.4)',
    borderInput: 'hsla(40, 25%, 35%, 0.3)',
    borderAccent: 'hsla(45, 90%, 55%, 0.5)',
    
    // الظلال - عميقة ودافئة
    shadow: 'hsla(0, 0%, 0%, 0.5)',
    shadowPrimary: 'hsla(45, 100%, 50%, 0.25)',
    shadowLarge: '0 25px 50px -12px hsla(0, 0%, 0%, 0.5)',
    
    // التدرجات - احترافية
    gradientHero: 'linear-gradient(90deg, hsla(20, 14%, 4%, 0.95) 0%, hsla(20, 14%, 4%, 0.6) 40%, transparent 70%)',
    gradientSection: 'linear-gradient(180deg, hsl(20, 14%, 4%) 0%, hsl(25, 18%, 8%) 50%, hsl(20, 14%, 4%) 100%)',
    gradientOverlay: 'linear-gradient(180deg, transparent 0%, hsla(20, 14%, 4%, 0.7) 50%, hsla(20, 14%, 4%, 0.98) 100%)',
    gradientCard: 'linear-gradient(145deg, hsl(20, 12%, 9%), hsl(20, 14%, 6%))',
    gradientPromo: 'linear-gradient(135deg, hsl(25, 30%, 12%) 0%, hsl(20, 25%, 8%) 100%)',
    gradientGold: 'linear-gradient(135deg, hsl(45, 100%, 51%), hsl(35, 90%, 45%))',
    
    // الأزرار
    buttonPrimary: 'linear-gradient(135deg, hsl(45, 100%, 51%), hsl(40, 95%, 48%))',
    buttonSecondary: 'hsla(40, 20%, 25%, 0.4)',
    buttonDanger: 'hsla(0, 70%, 55%, 0.2)',
    buttonText: 'hsl(20, 30%, 8%)',
    
    // الحالات
    success: 'hsl(152, 70%, 50%)',
    successBg: 'hsla(152, 70%, 50%, 0.15)',
    error: 'hsl(0, 80%, 60%)',
    errorBg: 'hsla(0, 80%, 60%, 0.15)',
    warning: 'hsl(45, 95%, 55%)',
    warningBg: 'hsla(45, 95%, 55%, 0.15)',
    info: 'hsl(210, 80%, 60%)',
    infoBg: 'hsla(210, 80%, 60%, 0.15)',
    
    // الهيدر
    headerBg: 'hsla(20, 14%, 4%, 0.97)',
    headerBgScrolled: 'hsla(20, 14%, 5%, 0.98)',
    topBarBg: 'hsl(45, 100%, 51%)',
    topBarText: 'hsl(20, 30%, 8%)',
    
    // الفوتر
    footerBg: 'linear-gradient(180deg, hsl(20, 14%, 4%) 0%, hsl(20, 16%, 3%) 100%)',
    footerFeaturesBg: 'hsla(40, 40%, 20%, 0.15)',
  },
  
  light: {
    // الخلفيات - فاتحة ودافئة
    background: 'hsl(40, 40%, 98%)',           // أبيض كريمي
    backgroundSecondary: 'hsl(40, 35%, 95%)',  // رمادي فاتح دافئ
    backgroundTertiary: 'hsl(38, 30%, 92%)',   // بيج فاتح
    backgroundCard: 'hsla(0, 0%, 100%, 0.9)',  // أبيض نقي للكروت
    backgroundInput: 'hsl(0, 0%, 100%)',       // أبيض للحقول
    backgroundOverlay: 'hsla(40, 40%, 98%, 0.98)', // تراكب فاتح
    
    // النصوص - داكنة جداً للقراءة الممتازة
    text: 'hsl(20, 35%, 12%)',           // بني داكن جداً (النص الرئيسي)
    textSecondary: 'hsl(20, 25%, 28%)',  // بني متوسط
    textMuted: 'hsl(20, 15%, 45%)',      // رمادي دافئ للنصوص الثانوية
    textInverse: 'hsl(45, 30%, 96%)',    // فاتح للخلفيات الداكنة
    
    // الألوان الرئيسية - بني/ذهبي غامق للفاتح
    primary: 'hsl(25, 85%, 35%)',         // بني ذهبي غني
    primaryHover: 'hsl(25, 85%, 40%)',    // أفتح قليلاً للهوفر
    primaryText: 'hsl(40, 40%, 98%)',     // نص فاتح على الرئيسي
    primaryGradient: 'linear-gradient(135deg, hsl(25, 85%, 35%), hsl(30, 80%, 40%))',
    
    // الأكسنت - ذهبي/عسلي
    accent: 'hsl(35, 95%, 42%)',
    accentMuted: 'hsla(35, 80%, 50%, 0.12)',
    accentLight: 'hsl(40, 85%, 50%)',
    accentGlow: 'hsla(35, 95%, 50%, 0.25)',
    
    // الحدود - واضحة
    border: 'hsla(20, 20%, 60%, 0.2)',
    borderHover: 'hsla(25, 70%, 45%, 0.4)',
    borderInput: 'hsla(20, 15%, 55%, 0.25)',
    borderAccent: 'hsla(25, 85%, 40%, 0.5)',
    
    // الظلال - ناعمة
    shadow: 'hsla(20, 30%, 20%, 0.08)',
    shadowPrimary: 'hsla(25, 85%, 35%, 0.2)',
    shadowLarge: '0 25px 50px -12px hsla(20, 30%, 20%, 0.15)',
    
    // التدرجات
    gradientHero: 'linear-gradient(90deg, hsla(40, 40%, 98%, 0.98) 0%, hsla(40, 40%, 98%, 0.7) 40%, transparent 70%)',
    gradientSection: 'linear-gradient(180deg, hsl(40, 40%, 98%) 0%, hsl(38, 35%, 94%) 50%, hsl(40, 40%, 98%) 100%)',
    gradientOverlay: 'linear-gradient(180deg, transparent 0%, hsla(40, 40%, 98%, 0.7) 50%, hsla(40, 40%, 98%, 0.98) 100%)',
    gradientCard: 'linear-gradient(145deg, hsl(0, 0%, 100%), hsl(40, 30%, 96%))',
    gradientPromo: 'linear-gradient(135deg, hsl(38, 40%, 95%) 0%, hsl(35, 35%, 92%) 100%)',
    gradientGold: 'linear-gradient(135deg, hsl(25, 85%, 35%), hsl(30, 80%, 30%))',
    
    // الأزرار
    buttonPrimary: 'linear-gradient(135deg, hsl(25, 85%, 35%), hsl(30, 80%, 38%))',
    buttonSecondary: 'hsla(20, 20%, 85%, 0.5)',
    buttonDanger: 'hsla(0, 60%, 55%, 0.12)',
    buttonText: 'hsl(40, 40%, 98%)',
    
    // الحالات
    success: 'hsl(152, 65%, 38%)',
    successBg: 'hsla(152, 65%, 38%, 0.1)',
    error: 'hsl(0, 75%, 50%)',
    errorBg: 'hsla(0, 75%, 50%, 0.1)',
    warning: 'hsl(35, 90%, 45%)',
    warningBg: 'hsla(35, 90%, 45%, 0.1)',
    info: 'hsl(210, 75%, 50%)',
    infoBg: 'hsla(210, 75%, 50%, 0.1)',
    
    // الهيدر
    headerBg: 'hsla(40, 40%, 99%, 0.98)',
    headerBgScrolled: 'hsla(40, 40%, 99%, 0.99)',
    topBarBg: 'hsl(25, 85%, 35%)',
    topBarText: 'hsl(40, 40%, 98%)',
    
    // الفوتر
    footerBg: 'linear-gradient(180deg, hsl(40, 35%, 95%) 0%, hsl(38, 30%, 92%) 100%)',
    footerFeaturesBg: 'hsla(35, 40%, 85%, 0.4)',
  }
};

export type ThemeColors = typeof themeColors.dark;

interface LuxuryThemeContextValue {
  mode: ThemeMode;
  colors: ThemeColors;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
  isLight: boolean;
}

const LuxuryThemeContext = createContext<LuxuryThemeContextValue | undefined>(undefined);

/** استخراج ثلاثية HSL من قيمة مثل "hsl(25, 85%, 35%)" إلى "25 85% 35%" لـ Tailwind */
function hslToTriplet(hsl: string): string {
  if (!hsl || !hsl.startsWith('hsl')) return '';
  const inner = hsl.replace(/^hsla?\(/, '').replace(/\)$/, '').split(',');
  return inner.slice(0, 3).map((s) => s.trim()).join(' ');
}

/**
 * تطبيق النمط على الـ DOM فوراً (بدون انتظار React).
 * يُستدعى عند الضغط على زر التبديل لظهور الثيم مباشرة ثم نحدّث الـ state لاحقاً.
 */
function applyThemeToDocumentImmediate(mode: ThemeMode, colors: ThemeColors): void {
  const root = document.documentElement;
  const c = colors;
  root.style.setProperty('--background', hslToTriplet(c.background) || (mode === 'dark' ? '20 14% 4%' : '40 40% 98%'));
  root.style.setProperty('--foreground', hslToTriplet(c.text) || (mode === 'dark' ? '45 30% 96%' : '20 35% 12%'));
  root.style.setProperty('--card', hslToTriplet(c.backgroundCard) || (mode === 'dark' ? '20 14% 9%' : '0 0% 100%'));
  root.style.setProperty('--card-foreground', hslToTriplet(c.text) || (mode === 'dark' ? '45 30% 96%' : '20 35% 12%'));
  root.style.setProperty('--popover', hslToTriplet(c.backgroundCard) || (mode === 'dark' ? '20 14% 9%' : '0 0% 100%'));
  root.style.setProperty('--popover-foreground', hslToTriplet(c.text) || (mode === 'dark' ? '45 30% 96%' : '20 35% 12%'));
  root.style.setProperty('--muted', hslToTriplet(c.backgroundTertiary) || (mode === 'dark' ? '20 10% 11%' : '38 30% 92%'));
  root.style.setProperty('--muted-foreground', hslToTriplet(c.textMuted) || '20 15% 45%');
  root.style.setProperty('--secondary', hslToTriplet(c.backgroundSecondary) || (mode === 'dark' ? '20 12% 7%' : '40 35% 95%'));
  root.style.setProperty('--secondary-foreground', hslToTriplet(c.textSecondary) || (mode === 'dark' ? '40 20% 78%' : '20 25% 28%'));
  root.style.setProperty('--border', hslToTriplet(c.border) || (mode === 'dark' ? '40 25% 35%' : '20 15% 55%'));
  root.style.setProperty('--primary', hslToTriplet(c.primary) || (mode === 'dark' ? '45 100% 51%' : '25 85% 35%'));
  root.style.setProperty('--primary-foreground', hslToTriplet(c.primaryText) || (mode === 'dark' ? '20 30% 8%' : '40 40% 98%'));
  root.style.setProperty('--accent', hslToTriplet(c.accent) || (mode === 'dark' ? '40 90% 55%' : '35 95% 42%'));
  root.style.setProperty('--accent-foreground', hslToTriplet(c.primaryText) || '0 0% 100%');
  root.style.setProperty('--input', hslToTriplet(c.backgroundInput) || (mode === 'dark' ? '20 12% 8%' : '40 30% 90%'));
  root.style.setProperty('--ring', hslToTriplet(c.primary) || (mode === 'dark' ? '45 100% 51%' : '25 85% 35%'));
  root.style.setProperty('--luxury-background', c.background);
  root.style.setProperty('--luxury-background-card', c.backgroundCard);
  root.style.setProperty('--luxury-text', c.text);
  root.style.setProperty('--luxury-text-secondary', c.textSecondary);
  root.style.setProperty('--luxury-border', c.border);
  root.style.setProperty('--luxury-primary', c.primary);
  root.style.setProperty('--luxury-accent', c.accent);
  if (mode === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
  root.style.colorScheme = mode;
  if (mode === 'dark' && c.background) {
    document.body.style.backgroundColor = c.background;
    root.style.backgroundColor = c.background;
  } else {
    document.body.style.backgroundColor = '#ffffff';
    root.style.backgroundColor = '#ffffff';
  }
}

export function LuxuryThemeProvider({ 
  children, 
  defaultMode = 'light',
  controlledMode,
  onModeChange,
  /** ألوان من إعدادات المتجر (ثيم المسوق) — عند وجودها تُستخدم بالكامل ولا يُستخدم ثيم ثابت */
  overrideColors,
}: { 
  children: React.ReactNode;
  defaultMode?: ThemeMode;
  controlledMode?: ThemeMode;
  onModeChange?: (mode: ThemeMode) => void;
  overrideColors?: ThemeColors | null;
}) {
  const [internalMode, setInternalMode] = useState<ThemeMode>(defaultMode);
  
  // Use controlled mode if provided, otherwise use internal state
  const mode = controlledMode !== undefined ? controlledMode : internalMode;
  const colors = overrideColors ?? themeColors[mode];
  
  // Apply CSS variables to document root for Portals (Sheet, Dialog, etc.)
  // When overrideColors (store theme) is provided, set all vars from it so nothing is static
  useEffect(() => {
    const root = document.documentElement;
    
    const applyTheme = () => {
      if (overrideColors) {
        // ثيم المتجر من الإعدادات: تطبيق ألوان المتجر على كل المتغيرات
        const c = overrideColors;
        root.style.setProperty('--background', mode === 'light' ? '0 0% 100%' : (hslToTriplet(c.background) || '20 14% 4%'));
        root.style.setProperty('--foreground', hslToTriplet(c.text) || (mode === 'dark' ? '45 30% 96%' : '222 47% 11%'));
        root.style.setProperty('--card', hslToTriplet(c.backgroundCard) || (mode === 'dark' ? '20 14% 9%' : '0 0% 100%'));
        root.style.setProperty('--card-foreground', hslToTriplet(c.text) || (mode === 'dark' ? '45 30% 96%' : '222 47% 11%'));
        root.style.setProperty('--popover', hslToTriplet(c.backgroundCard) || (mode === 'dark' ? '20 14% 9%' : '0 0% 100%'));
        root.style.setProperty('--popover-foreground', hslToTriplet(c.text) || (mode === 'dark' ? '45 30% 96%' : '222 47% 11%'));
        root.style.setProperty('--muted', hslToTriplet(c.backgroundTertiary) || (mode === 'dark' ? '20 10% 11%' : '210 40% 96%'));
        root.style.setProperty('--muted-foreground', hslToTriplet(c.textMuted) || (mode === 'dark' ? '20 15% 45%' : '215 16% 47%'));
        root.style.setProperty('--secondary', hslToTriplet(c.backgroundSecondary) || (mode === 'dark' ? '20 12% 7%' : '210 40% 96%'));
        root.style.setProperty('--secondary-foreground', hslToTriplet(c.textSecondary) || (mode === 'dark' ? '40 20% 78%' : '222 47% 11%'));
        root.style.setProperty('--border', hslToTriplet(c.border) || (mode === 'dark' ? '40 25% 35%' : '214 32% 91%'));
        root.style.setProperty('--primary', hslToTriplet(c.primary) || (mode === 'dark' ? '45 100% 51%' : '25 85% 35%'));
        root.style.setProperty('--primary-foreground', hslToTriplet(c.primaryText) || (mode === 'dark' ? '20 30% 8%' : '0 0% 100%'));
        root.style.setProperty('--accent', hslToTriplet(c.accent) || (mode === 'dark' ? '40 90% 55%' : '35 95% 42%'));
        root.style.setProperty('--accent-foreground', hslToTriplet(c.primaryText) || '0 0% 100%');
        root.style.setProperty('--input', hslToTriplet(c.backgroundInput) || (mode === 'dark' ? '20 12% 8%' : '214 32% 91%'));
        root.style.setProperty('--ring', hslToTriplet(c.primary) || (mode === 'dark' ? '45 100% 51%' : '25 85% 35%'));
        if (mode === 'dark') root.classList.add('dark');
        else root.classList.remove('dark');
        root.style.colorScheme = mode;
      } else {
        // ثيم افتراضي فاخر (قبل تحميل ثيم المتجر)
        if (mode === 'light') {
          root.style.setProperty('--background', '0 0% 100%');
          root.style.setProperty('--foreground', '222 47% 11%');
          root.style.setProperty('--card', '0 0% 100%');
          root.style.setProperty('--card-foreground', '222 47% 11%');
          root.style.setProperty('--popover', '0 0% 100%');
          root.style.setProperty('--popover-foreground', '222 47% 11%');
          root.style.setProperty('--muted', '210 40% 96%');
          root.style.setProperty('--muted-foreground', '215 16% 47%');
          root.style.setProperty('--secondary', '210 40% 96%');
          root.style.setProperty('--secondary-foreground', '222 47% 11%');
          root.style.setProperty('--border', '214 32% 91%');
          root.style.setProperty('--primary', '210 100% 50%');
          root.style.setProperty('--primary-foreground', '0 0% 100%');
          root.style.setProperty('--accent', '210 100% 50%');
          root.style.setProperty('--accent-foreground', '0 0% 100%');
          root.style.setProperty('--input', '214 32% 91%');
          root.style.setProperty('--ring', '210 100% 50%');
          root.classList.remove('dark');
          root.style.colorScheme = 'light';
        } else {
          root.style.setProperty('--background', '0 0% 0%');
          root.style.setProperty('--foreground', '0 0% 100%');
          root.style.setProperty('--card', '0 0% 5%');
          root.style.setProperty('--card-foreground', '0 0% 100%');
          root.style.setProperty('--popover', '0 0% 5%');
          root.style.setProperty('--popover-foreground', '0 0% 100%');
          root.style.setProperty('--muted', '0 0% 5%');
          root.style.setProperty('--muted-foreground', '0 0% 85%');
          root.style.setProperty('--secondary', '0 0% 12%');
          root.style.setProperty('--secondary-foreground', '0 0% 95%');
          root.style.setProperty('--border', '0 0% 30%');
          root.style.setProperty('--primary', '45 100% 51%');
          root.style.setProperty('--primary-foreground', '0 0% 0%');
          root.style.setProperty('--accent', '40 90% 55%');
          root.style.setProperty('--accent-foreground', '0 0% 0%');
          root.style.setProperty('--input', '0 0% 15%');
          root.style.setProperty('--ring', '45 100% 51%');
          root.classList.add('dark');
          root.style.colorScheme = 'dark';
        }
      }
      
      // Set custom luxury variables for direct use (always from current colors)
      root.style.setProperty('--luxury-background', colors.background);
      root.style.setProperty('--luxury-background-card', colors.backgroundCard);
      root.style.setProperty('--luxury-text', colors.text);
      root.style.setProperty('--luxury-text-secondary', colors.textSecondary);
      root.style.setProperty('--luxury-border', colors.border);
      root.style.setProperty('--luxury-primary', colors.primary);
      root.style.setProperty('--luxury-accent', colors.accent);
      // النمط الليلي: خلفية داكنة لـ body و html. النمط النهاري: خلفية بيضاء للصفحة
      if (mode === 'dark' && colors.background) {
        document.body.style.backgroundColor = colors.background;
        root.style.backgroundColor = colors.background;
      } else {
        document.body.style.backgroundColor = '#ffffff';
        root.style.backgroundColor = '#ffffff';
      }
    };
    
    const rafId = requestAnimationFrame(() => applyTheme());

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const hasDark = root.classList.contains('dark');
          if ((mode === 'dark' && !hasDark) || (mode === 'light' && hasDark)) {
            applyTheme();
          }
        }
      }
    });
    
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      document.body.style.backgroundColor = '';
      root.style.backgroundColor = '';
    };
  }, [mode, overrideColors]);
  
  const toggleMode = useCallback(() => {
    const newMode = mode === 'dark' ? 'light' : 'dark';
    // تطبيق الثيم على الـ DOM فوراً حتى يرى المستخدم التغيير مباشرة بدون تجمّد
    applyThemeToDocumentImmediate(newMode, themeColors[newMode]);
    if (onModeChange) {
      setTimeout(() => onModeChange(newMode), 0);
    } else {
      setTimeout(() => setInternalMode(newMode), 0);
    }
  }, [mode, onModeChange]);

  const setMode = useCallback((newMode: ThemeMode) => {
    applyThemeToDocumentImmediate(newMode, themeColors[newMode]);
    if (onModeChange) {
      setTimeout(() => onModeChange(newMode), 0);
    } else {
      setTimeout(() => setInternalMode(newMode), 0);
    }
  }, [onModeChange]);
  
  const value = useMemo(() => ({
    mode,
    colors,
    toggleMode,
    setMode,
    isDark: mode === 'dark',
    isLight: mode === 'light',
  }), [mode, colors, toggleMode, setMode]);
  
  return (
    <LuxuryThemeContext.Provider value={value}>
      {children}
    </LuxuryThemeContext.Provider>
  );
}

export function useLuxuryTheme() {
  const context = useContext(LuxuryThemeContext);
  if (!context) {
    // Return default dark theme if not in provider
    return {
      mode: 'dark' as ThemeMode,
      colors: themeColors.dark,
      toggleMode: () => {},
      setMode: () => {},
      isDark: true,
      isLight: false,
    };
  }
  return context;
}

// Export for backwards compatibility
export { themeColors as luxuryThemeColors };
