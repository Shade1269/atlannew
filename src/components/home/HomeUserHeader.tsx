import { UnifiedButton } from '@/components/design-system';
import { User, Languages, Sun, Moon, LogOut } from 'lucide-react';

interface HomeUserHeaderProps {
  userName: string;
  isDarkMode: boolean;
  onLanguageToggle: () => void;
  onDarkModeToggle: () => void;
  onSignOut: () => void;
}

export const HomeUserHeader = ({
  userName,
  isDarkMode,
  onLanguageToggle,
  onDarkModeToggle,
  onSignOut
}: HomeUserHeaderProps) => {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* User Info */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg">
            <User className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {userName}
            </span>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            <UnifiedButton
              variant="ghost"
              size="sm"
              onClick={onLanguageToggle}
            >
              <Languages className="h-4 w-4" />
            </UnifiedButton>
            
            <UnifiedButton
              variant="ghost"
              size="sm"
              onClick={onDarkModeToggle}
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </UnifiedButton>
            
            <UnifiedButton
              variant="ghost"
              size="sm"
              onClick={onSignOut}
            >
              <LogOut className="h-4 w-4" />
            </UnifiedButton>
          </div>
        </div>
      </div>
    </header>
  );
};
