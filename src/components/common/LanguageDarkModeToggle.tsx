import React from 'react';
import { Languages, Sun, Moon, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDarkMode } from '@/shared/components/DarkModeProvider';
import { UnifiedButton } from '@/components/design-system';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface LanguageDarkModeToggleProps {
  variant?: 'icon' | 'button' | 'compact';
  showLabels?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showInMobile?: boolean;
}

/**
 * Unified component for language and dark mode toggles
 * Can be used in headers, sidebars, or anywhere in the app
 * Automatically shows in mobile screens regardless of size
 */
export const LanguageDarkModeToggle: React.FC<LanguageDarkModeToggleProps> = ({
  variant = 'icon',
  showLabels = false,
  className = '',
  size = 'md',
  showInMobile = true,
}) => {
  const { language, toggleLanguage, t } = useLanguage();
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  const availableLanguages = [
    { code: 'ar', name: t('arabic'), nativeName: 'العربية', flag: '🇸🇦' },
    { code: 'en', name: t('english'), nativeName: 'English', flag: '🇺🇸' },
  ];

  const currentLanguage = availableLanguages.find(lang => lang.code === language) || availableLanguages[0];

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-10 w-10',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  if (variant === 'button') {
    return (
      <div className={`flex items-center gap-2 ${className} ${showInMobile ? '' : 'hidden md:flex'}`}>
        {/* Language Toggle Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <UnifiedButton
              variant="ghost"
              size={size}
              className="gap-2"
              title={t('toggleLanguage')}
            >
              <Languages className={iconSizes[size]} />
              {showLabels && (
                <span className="text-xs">
                  {currentLanguage.nativeName}
                </span>
              )}
            </UnifiedButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[150px]">
            {availableLanguages.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => {
                  if (lang.code !== language) {
                    toggleLanguage();
                  }
                }}
                className="cursor-pointer flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <span>{lang.flag}</span>
                  <span>{lang.nativeName}</span>
                </span>
                {lang.code === language && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Dark Mode Toggle Button */}
        <UnifiedButton
          variant="ghost"
          size={size}
          onClick={toggleDarkMode}
          className="gap-2"
          title={isDarkMode ? t('lightMode') : t('darkMode')}
        >
          {isDarkMode ? (
            <Sun className={iconSizes[size]} />
          ) : (
            <Moon className={iconSizes[size]} />
          )}
          {showLabels && (
            <span className="text-xs">
              {isDarkMode ? t('lightMode') : t('darkMode')}
            </span>
          )}
        </UnifiedButton>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1 sm:gap-2 ${className} ${showInMobile ? '' : 'hidden md:flex'}`}>
        {/* زر تغيير المود - نفس تنسيق باقي الأيقونات */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDarkMode}
          className="h-8 w-8 sm:h-9 sm:w-9"
          title={isDarkMode ? t('lightMode') : t('darkMode')}
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </Button>

        {/* زر تغيير اللغة - نفس تنسيق زر المود */}
        <div className="flex flex-col items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9"
                title={t('toggleLanguage')}
              >
                <Languages className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[150px]">
              {availableLanguages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => {
                    if (lang.code !== language) {
                      toggleLanguage();
                    }
                  }}
                  className="cursor-pointer flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.nativeName}</span>
                  </span>
                  {lang.code === language && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <span className="text-[8px] sm:text-[10px] font-semibold text-muted-foreground">
            {language === 'ar' ? 'AR' : 'EN'}
          </span>
        </div>
      </div>
    );
  }

  // Default: icon variant
  return (
    <div className={`flex items-center gap-1 ${className} ${showInMobile ? '' : 'hidden md:flex'}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <UnifiedButton
            variant="ghost"
            size={`icon-${size}` as any}
            className={sizeClasses[size]}
            title={`${t('toggleLanguage')}: ${currentLanguage.nativeName}`}
          >
            <Languages className={iconSizes[size]} />
          </UnifiedButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[150px]">
          <div className="px-2 py-1.5 text-xs text-muted-foreground border-b">
            {t('language')}
          </div>
          {availableLanguages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => {
                if (lang.code !== language) {
                  toggleLanguage();
                }
              }}
              className="cursor-pointer flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <span>{lang.nativeName}</span>
              </span>
              {lang.code === language && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <UnifiedButton
        variant="ghost"
        size={`icon-${size}` as any}
        onClick={toggleDarkMode}
        className={sizeClasses[size]}
        title={isDarkMode ? t('lightMode') : t('darkMode')}
      >
        {isDarkMode ? (
          <Sun className={iconSizes[size]} />
        ) : (
          <Moon className={iconSizes[size]} />
        )}
      </UnifiedButton>
    </div>
  );
};

export default LanguageDarkModeToggle;

