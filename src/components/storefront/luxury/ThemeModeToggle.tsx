import { motion } from 'framer-motion';
import { Sun, Moon, Sparkles } from 'lucide-react';

export type ThemeMode = 'dark' | 'light';

interface ThemeModeToggleProps {
  mode: ThemeMode;
  onToggle: () => void;
}

export function ThemeModeToggle({ mode, onToggle }: ThemeModeToggleProps) {
  const isDark = mode === 'dark';

  return (
    <motion.button
      onClick={onToggle}
      className="fixed bottom-8 left-8 z-[9999] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border-2"
      style={{
        background: isDark 
          ? 'linear-gradient(135deg, hsl(45, 100%, 50%), hsl(38, 95%, 45%))'
          : 'linear-gradient(135deg, hsl(25, 85%, 40%), hsl(20, 80%, 35%))',
        color: isDark ? 'hsl(20, 30%, 8%)' : 'hsl(45, 30%, 96%)',
        borderColor: isDark 
          ? 'hsla(45, 100%, 60%, 0.6)'
          : 'hsla(25, 85%, 50%, 0.6)',
        boxShadow: isDark 
          ? '0 15px 50px hsla(45, 100%, 50%, 0.5), 0 5px 20px hsla(0, 0%, 0%, 0.3)'
          : '0 15px 50px hsla(25, 85%, 40%, 0.4), 0 5px 20px hsla(0, 0%, 0%, 0.2)',
      }}
      whileHover={{ scale: 1.08, y: -3 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
    >
      <motion.div
        key={mode}
        initial={{ rotate: -180, opacity: 0, scale: 0.5 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        exit={{ rotate: 180, opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.4, type: 'spring' }}
      >
        {isDark ? (
          <Sun className="w-6 h-6" />
        ) : (
          <Moon className="w-6 h-6" />
        )}
      </motion.div>
      <span className="text-base font-bold">
        {isDark ? 'الوضع النهاري' : 'الوضع الليلي'}
      </span>
      <Sparkles className="w-5 h-5 opacity-80" />
    </motion.button>
  );
}

// ألوان الثيم
export const themeColors = {
  dark: {
    // الخلفيات
    background: 'hsl(20, 12%, 6%)',
    backgroundSecondary: 'hsl(20, 12%, 8%)',
    backgroundTertiary: 'hsl(20, 12%, 12%)',
    
    // النصوص
    text: 'hsl(38, 25%, 90%)',
    textSecondary: 'hsl(38, 20%, 75%)',
    textMuted: 'hsl(38, 15%, 55%)',
    
    // الألوان الرئيسية
    primary: 'hsl(38, 90%, 50%)',
    primaryHover: 'hsl(38, 90%, 55%)',
    primaryText: 'hsl(20, 15%, 10%)',
    
    // الأكسنت
    accent: 'hsl(38, 70%, 60%)',
    accentMuted: 'hsla(38, 30%, 30%, 0.2)',
    
    // الحدود
    border: 'hsla(38, 30%, 30%, 0.15)',
    borderHover: 'hsla(38, 50%, 50%, 0.3)',
    
    // الظلال
    shadow: 'hsla(0, 0%, 0%, 0.4)',
    shadowPrimary: 'hsla(38, 90%, 45%, 0.35)',
    
    // التدرجات
    gradientHero: 'linear-gradient(90deg, hsla(20, 15%, 5%, 0.85) 0%, hsla(20, 15%, 5%, 0.4) 50%, transparent 100%)',
    gradientSection: 'linear-gradient(135deg, hsl(38, 50%, 20%), hsl(20, 30%, 15%))',
  },
  light: {
    // الخلفيات
    background: 'hsl(40, 30%, 97%)',
    backgroundSecondary: 'hsl(40, 25%, 94%)',
    backgroundTertiary: 'hsl(40, 20%, 90%)',
    
    // النصوص
    text: 'hsl(20, 30%, 15%)',
    textSecondary: 'hsl(20, 20%, 30%)',
    textMuted: 'hsl(20, 15%, 50%)',
    
    // الألوان الرئيسية
    primary: 'hsl(20, 70%, 35%)',
    primaryHover: 'hsl(20, 70%, 40%)',
    primaryText: 'hsl(40, 30%, 97%)',
    
    // الأكسنت
    accent: 'hsl(38, 80%, 45%)',
    accentMuted: 'hsla(38, 60%, 50%, 0.15)',
    
    // الحدود
    border: 'hsla(20, 20%, 70%, 0.3)',
    borderHover: 'hsla(38, 50%, 50%, 0.5)',
    
    // الظلال
    shadow: 'hsla(20, 30%, 20%, 0.1)',
    shadowPrimary: 'hsla(20, 70%, 35%, 0.2)',
    
    // التدرجات
    gradientHero: 'linear-gradient(90deg, hsla(40, 30%, 97%, 0.9) 0%, hsla(40, 30%, 97%, 0.5) 50%, transparent 100%)',
    gradientSection: 'linear-gradient(135deg, hsl(40, 40%, 92%), hsl(38, 35%, 88%))',
  }
};

// Hook للحصول على ألوان الثيم
export function useThemeMode(mode: ThemeMode) {
  return themeColors[mode];
}
