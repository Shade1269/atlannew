import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Heart, Search, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LuxuryStoreLayoutProps {
  children: React.ReactNode;
  storeName: string;
  logoUrl?: string;
  cartCount?: number;
  wishlistCount?: number;
  onCartClick?: () => void;
  onWishlistClick?: () => void;
  onSearchClick?: () => void;
  onMenuClick?: () => void;
  onLogoClick?: () => void;
}

export const LuxuryStoreLayout: React.FC<LuxuryStoreLayoutProps> = ({
  children,
  storeName,
  logoUrl: _logoUrl,
  cartCount = 0,
  wishlistCount = 0,
  onCartClick,
  onWishlistClick,
  onSearchClick,
  onMenuClick: _onMenuClick,
  onLogoClick,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'جديد', href: '#new' },
    { label: 'المجموعة', href: '#collection' },
    { label: 'أتيلييه', href: '#atelier' },
    { label: 'عنّا', href: '#about' },
  ];

  return (
    <div 
      className="min-h-screen"
      style={{
        background: 'linear-gradient(180deg, hsl(20, 12%, 8%) 0%, hsl(20, 12%, 6%) 100%)',
        color: 'hsl(38, 25%, 90%)',
      }}
      data-theme="maison-elegance"
    >
      {/* Luxury Header */}
      <motion.header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled ? "py-3" : "py-5"
        )}
        style={{
          background: scrolled 
            ? 'hsla(20, 12%, 8%, 0.95)' 
            : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid hsla(38, 30%, 50%, 0.1)' : 'none',
        }}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="container mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <motion.div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={onLogoClick}
            whileHover={{ scale: 1.02 }}
          >
            <span 
              className="text-lg md:text-xl font-light tracking-[0.3em] uppercase"
              style={{ 
                fontFamily: "'Playfair Display', serif",
                color: 'hsl(38, 25%, 90%)',
              }}
            >
              {storeName}
            </span>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-10">
            {navItems.map((item) => (
              <motion.a
                key={item.label}
                href={item.href}
                className="text-sm tracking-widest uppercase opacity-70 hover:opacity-100 transition-opacity"
                style={{ fontFamily: "'Inter', sans-serif" }}
                whileHover={{ y: -2 }}
              >
                {item.label}
              </motion.a>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4 md:gap-6">
            <motion.button
              onClick={onSearchClick}
              className="p-2 opacity-70 hover:opacity-100 transition-opacity"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Search className="w-5 h-5" />
            </motion.button>
            
            <motion.button
              onClick={onWishlistClick}
              className="p-2 opacity-70 hover:opacity-100 transition-opacity relative"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span 
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] flex items-center justify-center"
                  style={{ 
                    background: 'hsl(38, 90%, 50%)',
                    color: 'hsl(20, 12%, 5%)',
                  }}
                >
                  {wishlistCount}
                </span>
              )}
            </motion.button>

            <motion.button
              onClick={onCartClick}
              className="p-2 opacity-70 hover:opacity-100 transition-opacity relative"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span 
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] flex items-center justify-center"
                  style={{ 
                    background: 'hsl(38, 90%, 50%)',
                    color: 'hsl(20, 12%, 5%)',
                  }}
                >
                  {cartCount}
                </span>
              )}
            </motion.button>

            <motion.button
              className="lg:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              whileTap={{ scale: 0.95 }}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden overflow-hidden"
              style={{ 
                background: 'hsla(20, 12%, 8%, 0.98)',
                borderTop: '1px solid hsla(38, 30%, 50%, 0.1)',
              }}
            >
              <nav className="container mx-auto px-6 py-6 flex flex-col gap-4">
                {navItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="text-lg tracking-widest uppercase opacity-70 hover:opacity-100 transition-opacity py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Main Content */}
      <main className="relative">
        {children}
      </main>

      {/* Luxury Footer */}
      <footer 
        className="py-16 mt-20"
        style={{ 
          background: 'hsl(20, 12%, 6%)',
          borderTop: '1px solid hsla(38, 30%, 50%, 0.1)',
        }}
      >
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 
              className="text-2xl mb-4 tracking-[0.2em] uppercase"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {storeName}
            </h3>
            <p className="opacity-50 text-sm tracking-wider mb-8">
              أناقة شرقية • فخامة مختارة
            </p>
            <div className="flex justify-center gap-6">
              <a href="#" className="opacity-50 hover:opacity-100 transition-opacity">Instagram</a>
              <a href="#" className="opacity-50 hover:opacity-100 transition-opacity">Twitter</a>
              <a href="#" className="opacity-50 hover:opacity-100 transition-opacity">Pinterest</a>
            </div>
          </motion.div>
        </div>
      </footer>
    </div>
  );
};
