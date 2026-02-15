import React, { createContext, useContext, useEffect, useState } from 'react';

interface DarkModeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (context === undefined) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
};

interface DarkModeProviderProps {
  children: React.ReactNode;
}

export const DarkModeProvider: React.FC<DarkModeProviderProps> = ({ children }) => {
  // Default to Dark Mode for Atlantis platform
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Initialize: إن لم يكن هناك تفضيل محفوظ، نتبع نظام الجهاز (وضع ليلي/نهاري تلقائي)
  useEffect(() => {
    try {
      const stored = (typeof window !== 'undefined' ? window.localStorage?.getItem('darkMode') : null);
      let shouldBeDark: boolean;
      if (stored !== null) {
        shouldBeDark = stored === 'true';
      } else {
        const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
        shouldBeDark = prefersDark;
      }
      setIsDarkMode(shouldBeDark);
      updateDarkModeClass(shouldBeDark);
    } catch {
      setIsDarkMode(true);
      updateDarkModeClass(true);
    }
  }, []);

  // عند تغيير نظام الجهاز، نحدث فقط إن لم يكن للمستخدم تفضيل محفوظ
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      try {
        const stored = (typeof window !== 'undefined' ? window.localStorage?.getItem('darkMode') : null);
        if (stored === null) {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          setIsDarkMode(prefersDark);
          updateDarkModeClass(prefersDark);
        }
      } catch {
        // ignore
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const updateDarkModeClass = (dark: boolean) => {
    if (dark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    try {
      if (typeof window !== 'undefined') {
        window.localStorage?.setItem('darkMode', newMode.toString());
      }
    } catch {
      // ignore storage errors
    }
    updateDarkModeClass(newMode);
  };

  const value = {
    isDarkMode,
    toggleDarkMode,
  };

  return (
    <DarkModeContext.Provider value={value}>
      {children}
    </DarkModeContext.Provider>
  );
};