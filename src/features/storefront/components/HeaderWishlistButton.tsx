import React from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface HeaderWishlistButtonProps {
  count: number;
  onClick: () => void;
  className?: string;
}

export const HeaderWishlistButton: React.FC<HeaderWishlistButtonProps> = ({
  count,
  onClick,
  className
}) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn(
        'relative p-2.5 rounded-lg transition-colors hover:bg-secondary/50',
        className
      )}
    >
      <Heart className="w-6 h-6 text-foreground/70" />
      {count > 0 && (
        <Badge 
          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 text-white border-0"
        >
          {count > 99 ? '99+' : count}
        </Badge>
      )}
    </Button>
  );
};
