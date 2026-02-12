import React from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWishlist } from '../hooks/useWishlist';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface WishlistButtonProps {
  productId: string;
  storeId: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'button';
  className?: string;
}

export const WishlistButton: React.FC<WishlistButtonProps> = ({
  productId,
  storeId,
  size = 'md',
  variant = 'icon',
  className
}) => {
  const { isInWishlist, toggleWishlist, loading } = useWishlist(storeId);
  const isWishlisted = isInWishlist(productId);

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  if (variant === 'button') {
    return (
      <Button
        variant={isWishlisted ? 'default' : 'outline'}
        size="sm"
        onClick={() => toggleWishlist(productId)}
        disabled={loading}
        className={cn(
          'gap-2 transition-all duration-300',
          isWishlisted && 'bg-red-500 hover:bg-red-600 border-red-500',
          className
        )}
      >
        <Heart className={cn(iconSizes[size], isWishlisted && 'fill-current')} />
        {isWishlisted ? 'في المفضلة' : 'أضف للمفضلة'}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => toggleWishlist(productId)}
      disabled={loading}
      className={cn(
        sizeClasses[size],
        'rounded-full bg-background/80 backdrop-blur hover:bg-background transition-all duration-300',
        isWishlisted && 'text-red-500',
        className
      )}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isWishlisted ? 'filled' : 'empty'}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Heart 
            className={cn(
              iconSizes[size],
              'transition-all duration-300',
              isWishlisted && 'fill-red-500 text-red-500'
            )} 
          />
        </motion.div>
      </AnimatePresence>
    </Button>
  );
};
