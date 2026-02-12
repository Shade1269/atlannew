import { createContext, useContext, useEffect, useState } from 'react';
import { supabasePublic } from '@/integrations/supabase/publicClient';

// Simple theme config type
interface StoreThemeConfig {
  primary?: string;
  secondary?: string;
  [key: string]: any;
}

interface ThemeData {
  id: string;
  name: string;
  name_ar: string;
  theme_config: any;
  is_premium: boolean;
}

interface ThemeContextType {
  currentTheme: StoreThemeConfig | null;
  themeData: ThemeData | null;
  isLuxuryTheme: boolean;
  themeName: string;
  applyTheme: (config: StoreThemeConfig) => void;
  resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

interface ThemeProviderProps {
  children: React.ReactNode;
  storeId?: string;
}

export const StoreThemeProvider = ({ children, storeId }: ThemeProviderProps) => {
  const [currentThemeConfig, setCurrentThemeConfig] = useState<StoreThemeConfig | null>(null);
  const [themeData, setThemeData] = useState<ThemeData | null>(null);

  // تحميل إعدادات الثيم للمتجر
  useEffect(() => {
    if (storeId) {
      loadThemeConfig(storeId);
    }
  }, [storeId]);

  // إضافة class للإشارة إلى أننا في صفحة متجر
  // لا نزيل النمط الليلي - نحافظ على اختيار المستخدم
  useEffect(() => {
    // إضافة class للإشارة إلى أننا في صفحة متجر
    document.body.classList.add('store-theme');
    
    return () => {
      document.body.classList.remove('store-theme');
    };
  }, []);

  const loadThemeConfig = async (storeId: string) => {
    try {
      // جلب بيانات الثيم مع إعداداته
      const { data: storeData } = await supabasePublic
        .from('affiliate_stores')
        .select(`
          current_theme_id,
          store_themes!current_theme_id(
            id,
            name,
            name_ar,
            theme_config,
            is_premium
          )
        `)
        .eq('id', storeId)
        .single();

      if (storeData?.store_themes) {
        const theme = storeData.store_themes as any;
        setThemeData({
          id: theme.id,
          name: theme.name,
          name_ar: theme.name_ar,
          theme_config: theme.theme_config,
          is_premium: theme.is_premium,
        });
      }

      // استخدام supabasePublic مباشرة لجلب إعدادات الثيم
      const { data, error } = await supabasePublic.rpc('get_store_theme_config', {
        p_store_id: storeId
      });

      if (error) {
        console.error('❌ Theme config error:', error);
        return;
      }

      const rawData = data as any;
      const config = rawData?.theme_config ? rawData.theme_config : rawData;
      
      if (config && Object.keys(config).length > 0) {
        setCurrentThemeConfig(config as StoreThemeConfig);
        applyThemeToDOM(config as StoreThemeConfig);
      }
    } catch (error) {
      console.error('❌ خطأ في تحميل إعدادات الثيم:', error);
    }
  };

  const applyThemeToDOM = (configParam: StoreThemeConfig | any) => {
    // دعم الأشكال: { theme_config: {...} } أو { colors: {...} } أو خريطة ألوان مسطحة
    const themeConfig: any = (configParam as any)?.theme_config ?? configParam;
    const colorsSource: Record<string, any> = themeConfig?.colors ?? themeConfig;
    
    if (!colorsSource || Object.keys(colorsSource).length === 0) {
      return;
    }

    const root = document.documentElement;
    const { typography, layout, effects } = themeConfig as any;

    // تحويل Hex/RGB إلى ثلاثية H S% L%
    const hexToHslTriplet = (hex: string): string => {
      let h = hex.replace('#', '');
      if (h.length === 3) h = h.split('').map(c => c + c).join('');
      const r = parseInt(h.substring(0, 2), 16) / 255;
      const g = parseInt(h.substring(2, 4), 16) / 255;
      const b = parseInt(h.substring(4, 6), 16) / 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let hh = 0, s = 0, l = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: hh = (g - b) / d + (g < b ? 6 : 0); break;
          case g: hh = (b - r) / d + 2; break;
          case b: hh = (r - g) / d + 4; break;
        }
        hh /= 6;
      }
      return `${Math.round(hh * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    };

    const rgbToHslTriplet = (rgb: string): string => {
      const nums = rgb.replace(/rgba?\(/, '').replace(/\)/, '').split(',').slice(0,3).map(n => parseFloat(n.trim()));
      const [r0, g0, b0] = nums as any;
      const r = (r0 as number) / 255, g = (g0 as number) / 255, b = (b0 as number) / 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }
      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    };

    const normalizeColor = (val: string): string => {
      if (!val) return '';
      const v = String(val).trim();
      if (v.startsWith('hsl(')) return v.slice(4, -1).replace(/,\s*/g, ' ').trim();
      if (v.startsWith('#')) return hexToHslTriplet(v).replace(/,\s*/g, ' ').trim();
      if (v.startsWith('rgb')) return rgbToHslTriplet(v).replace(/,\s*/g, ' ').trim();
      // إذا كانت بالفعل ثلاثية HSL بدون hsl() نتركها كما هي لكن نزيل الفواصل
      if (!v.includes('(') && v.includes('%')) return v.replace(/,\s*/g, ' ').trim();
      return v; // fallback (قد تكون var(--...))
    };

    // مفاتيح شائعة → الرموز القياسية في Tailwind (hsl(var(--token)))
    const keyAliasMap: Record<string, string> = {
      // الأساسية
      primary_color: 'primary', primaryColor: 'primary',
      secondary_color: 'secondary', secondaryColor: 'secondary',
      accent_color: 'accent', accentColor: 'accent',
      background_color: 'background', backgroundColor: 'background', bg: 'background',
      foreground_color: 'foreground', foregroundColor: 'foreground', fg: 'foreground', text: 'foreground', textColor: 'foreground',
      muted_color: 'muted', mutedColor: 'muted',
      card_background: 'card', cardColor: 'card', card_background_color: 'card',
      border_color: 'border', borderColor: 'border',
      input_color: 'input', inputColor: 'input',
      ring_color: 'ring', ringColor: 'ring',
      popover_color: 'popover', popover: 'popover',
      // foregrounds
      primary_foreground: 'primary-foreground', primaryForeground: 'primary-foreground',
      secondary_foreground: 'secondary-foreground', secondaryForeground: 'secondary-foreground',
      accent_foreground: 'accent-foreground', accentForeground: 'accent-foreground',
      muted_foreground: 'muted-foreground', mutedForeground: 'muted-foreground',
      card_foreground: 'card-foreground', cardForeground: 'card-foreground',
      popover_foreground: 'popover-foreground', popoverForeground: 'popover-foreground',
      destructive_color: 'destructive', destructive: 'destructive',
      destructive_foreground: 'destructive-foreground', destructiveForeground: 'destructive-foreground',
    };

    Object.entries(colorsSource).forEach(([rawKey, value]) => {
      const key = keyAliasMap[rawKey] || rawKey;
      const normalized = normalizeColor(String(value));
      // استخدام القيمة المنظمة مباشرة بدون إضافة hsl() لأن Tailwind يتوقع ثلاثية فقط
      root.style.setProperty(`--${key}`, normalized);
    });

    // Apply storefront dark override if active
    if (document.documentElement.classList.contains('storefront-dark')) {
      // Tailwind HSL triplets (used with hsl(var(--token)))
      root.style.setProperty('--background', '222 47% 11%');
      root.style.setProperty('--foreground', '210 40% 98%');
      root.style.setProperty('--card', '217 33% 17%');
      root.style.setProperty('--card-foreground', '210 40% 98%');
      root.style.setProperty('--popover', '217 33% 17%');
      root.style.setProperty('--popover-foreground', '210 40% 98%');
      root.style.setProperty('--input', '217 33% 24%');
      root.style.setProperty('--muted', '217 33% 17%');
      root.style.setProperty('--muted-foreground', '215 20% 65%');
      root.style.setProperty('--secondary', '217 33% 20%');
      root.style.setProperty('--secondary-foreground', '210 40% 98%');
      root.style.setProperty('--accent', '217 33% 24%');
      root.style.setProperty('--accent-foreground', '210 40% 98%');

      // Raw CSS variables used directly (not via hsl())
      root.style.setProperty('--bg', 'hsl(222, 47%, 11%)');
      root.style.setProperty('--fg', 'hsl(210, 40%, 98%)');
      root.style.setProperty('--surface', 'hsl(217, 33%, 17%)');
      root.style.setProperty('--surface-2', 'hsl(217, 33%, 20%)');
      root.style.setProperty('--border', 'hsl(217, 33%, 24%)');
    }

    // الخطوط
    if (typography?.fontFamily) {
      root.style.setProperty('--font-sans', typography.fontFamily);
      document.body.style.fontFamily = typography.fontFamily;
    }
    if (typography?.headingFont) {
      root.style.setProperty('--font-heading', typography.headingFont);
    }

    // التخطيط
    if (layout?.borderRadius) {
      root.style.setProperty('--radius', String(layout.borderRadius).replace('px', '').replace('rem', 'rem'));
    }

    // التأثيرات
    if (effects) {
      if (effects.shadows === 'luxury') {
        root.style.setProperty('--shadow', '0 25px 50px -12px rgba(0, 0, 0, 0.25)');
      } else if (effects.shadows === 'minimal') {
        root.style.setProperty('--shadow', '0 1px 3px 0 rgba(0, 0, 0, 0.1)');
      } else if (effects.shadows === 'warm') {
        root.style.setProperty('--shadow', '0 10px 15px -3px rgba(251, 146, 60, 0.1)');
      } else if (effects.shadows === 'colorful') {
        root.style.setProperty('--shadow', '0 10px 15px -3px rgba(147, 51, 234, 0.1)');
      }

      if (effects.animations === 'elegant') {
        root.style.setProperty('--transition', 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)');
      } else if (effects.animations === 'bouncy') {
        root.style.setProperty('--transition', 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)');
      } else if (effects.animations === 'gentle') {
        root.style.setProperty('--transition', 'all 0.5s ease-in-out');
      }
    }

    // تنظيف classes السابقة وإضافة class للثيم
    document.body.className = document.body.className.replace(/theme-\w+/g, '').trim();
    const themeClass = getThemeClassName(themeConfig as StoreThemeConfig);
    document.body.classList.add(themeClass, 'store-theme');
    
    // لا نغير data-theme على html لأنه محجوز للثيم العالمي (anaqati)
    // نضيف الثيم المخصص على body فقط
    document.body.setAttribute('data-store-theme', themeClass.replace('theme-', ''));

    // فرض إعادة render للتأكد من تطبيق الألوان
    document.body.style.visibility = 'hidden';
    setTimeout(() => {
      document.body.style.visibility = 'visible';
    }, 0);
  };

  const getThemeClassName = (config: StoreThemeConfig): string => {
    const { primary } = (config as any).colors || (config as any) || {};
    if (typeof primary === 'string') {
      if (primary.includes('349') && primary.includes('69%') && primary.includes('45%')) return 'theme-ferrari';
      if (primary.includes('45, 100%, 51%')) return 'theme-luxury';
      if (primary.includes('30, 67%, 44%')) return 'theme-traditional';
      if (primary.includes('280, 100%, 70%')) return 'theme-colorful';
      // 4 ثيمات جديدة
      if (primary.includes('340') && primary.includes('65%')) return 'theme-rose-boutique';
      if (primary.includes('215') && primary.includes('70%')) return 'theme-navy-exec';
      if (primary.includes('168') && primary.includes('70%')) return 'theme-mint-fresh';
      if (primary.includes('45') && primary.includes('90%')) return 'theme-royal-gold';
    }
    return 'theme-modern';
  };

  const applyTheme = (config: StoreThemeConfig) => {
    setCurrentThemeConfig(config);
    applyThemeToDOM(config);
  };

  const resetTheme = () => {
    setCurrentThemeConfig(null);
    const root = document.documentElement;
    const cssVariables = [
      '--primary', '--secondary', '--accent', '--background', '--foreground',
      '--muted', '--card', '--border', '--input', '--ring',
      '--primary-foreground', '--secondary-foreground', '--accent-foreground', '--muted-foreground', '--card-foreground',
      '--font-sans', '--font-heading', '--radius', '--shadow', '--transition'
    ];
    cssVariables.forEach(variable => root.style.removeProperty(variable));
    document.body.className = document.body.className.replace(/theme-\w+/g, '').trim();
  };

  // حساب قيم الثيم
  const isLuxuryTheme = themeData?.name?.toLowerCase().includes('maison') || 
                        themeData?.name?.toLowerCase().includes('luxury') ||
                        themeData?.name?.toLowerCase().includes('elegance') ||
                        themeData?.name_ar?.includes('الأناقة') || false;

  const themeName = themeData?.name || 'default';

  return (
    <ThemeContext.Provider value={{ 
      currentTheme: currentThemeConfig, 
      themeData,
      isLuxuryTheme,
      themeName,
      applyTheme, 
      resetTheme 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useStoreTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useStoreTheme must be used within a StoreThemeProvider');
  return context;
};
