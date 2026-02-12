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

  // Initialize dark mode from localStorage, default to dark if not set
  useEffect(() => {
    try {
      const stored = (typeof window !== 'undefined' ? window.localStorage?.getItem('darkMode') : null);
      // If user has explicitly set a preference, use it. Otherwise default to dark.
      const shouldBeDark = stored !== null ? stored === 'true' : true;
      setIsDarkMode(shouldBeDark);
      updateDarkModeClass(shouldBeDark);
    } catch {
      // Safari Private mode may block localStorage - default to dark
      setIsDarkMode(true);
      updateDarkModeClass(true);
    }
  }, []);

  // Listen for system theme changes (but default to dark for Atlantis)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (_e: MediaQueryListEvent) => {
      try {
        const stored = (typeof window !== 'undefined' ? window.localStorage?.getItem('darkMode') : null);
        // Only follow system preference if user hasn't set a preference
        // For Atlantis, we default to dark mode regardless of system preference
        if (stored === null) {
          // Keep dark mode as default for Atlantis
          setIsDarkMode(true);
          updateDarkModeClass(true);
        }
      } catch {
        setIsDarkMode(true);
        updateDarkModeClass(true);
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