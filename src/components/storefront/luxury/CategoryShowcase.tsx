import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpLeft } from 'lucide-react';
import { useLuxuryTheme } from './LuxuryThemeContext';

interface Category {
  id: string;
  name: string;
  imageUrl?: string;
  productCount: number;
}

interface CategoryShowcaseProps {
  categories?: Category[];
  onCategoryClick?: (category: Category) => void;
  /** رابط صفحة "عرض الكل" (مثلاً /store-slug/shop) */
  showAllHref?: string;
}

// صور افتراضية جميلة للفئات عند عدم وجود صور حقيقية
const getCategoryPlaceholderImage = (index: number): string => {
  const placeholderImages = [
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600', // متجر أنيق
    'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600', // تسوق
    'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600', // تسوق راقي
    'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600', // هدايا
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600', // تسوق إلكتروني
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600', // أزياء
  ];
  return placeholderImages[index % placeholderImages.length];
};

export const CategoryShowcase: React.FC<CategoryShowcaseProps> = ({
  categories = [],
  onCategoryClick,
  showAllHref,
}) => {
  const { colors, isDark } = useLuxuryTheme();

  // لا تعرض القسم إذا لم تكن هناك فئات
  if (!categories || categories.length === 0) {
    return null;
  }

  const showAllEl = (
    <motion.span
      className="text-sm tracking-wide flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity"
      style={{ color: isDark ? '#ffffff' : '#000000' }}
      whileHover={{ x: -4 }}
    >
      عرض الكل
      <ArrowUpLeft className="w-4 h-4" />
    </motion.span>
  );

  return (
    <section 
      className="py-16 md:py-24 transition-colors duration-500"
      style={{ background: 'transparent' }}
    >
      <div className="container mx-auto px-4 md:px-6">
        {/* Section Header — الأقسام بلون أسود (فاتح) أو أبيض (ليلي)، الوصف بلون الثيم */}
        <motion.div 
          className="flex items-center justify-between mb-10 md:mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div>
            <h2 
              className="text-2xl md:text-4xl font-bold"
              style={{ 
                fontFamily: "'Playfair Display', serif", 
                color: isDark ? '#ffffff' : '#000000',
              }}
            >
              الأقسام
            </h2>
            <p 
              className="text-sm mt-2 max-w-md"
              style={{ color: colors.accent }}
            >
              تصفحي منتجات متجرنا حسب القسم
            </p>
          </div>
          {showAllHref ? (
            <Link to={showAllHref} className="inline-flex">
              {showAllEl}
            </Link>
          ) : (
            <a href="#collection">{showAllEl}</a>
          )}
        </motion.div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              className="group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onClick={() => onCategoryClick?.(category)}
            >
              {/* Image */}
              <motion.img
                src={category.imageUrl || getCategoryPlaceholderImage(index)}
                alt={category.name}
                className="w-full h-full object-cover"
                whileHover={{ scale: 1.08 }}
                transition={{ duration: 0.6 }}
              />
              
              {/* Overlay */}
              <div 
                className="absolute inset-0 transition-opacity group-hover:opacity-80"
                style={{
                  background: isDark 
                    ? 'linear-gradient(180deg, transparent 30%, hsla(20, 15%, 5%, 0.9) 100%)'
                    : 'linear-gradient(180deg, transparent 30%, hsla(20, 20%, 15%, 0.85) 100%)',
                  opacity: 0.9,
                }}
              />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                <h3 
                  className="text-lg md:text-xl mb-1"
                  style={{ 
                    fontFamily: "'Playfair Display', serif",
                    color: 'hsl(38, 20%, 95%)',
                  }}
                >
                  {category.name}
                </h3>
                <p 
                  className="text-xs md:text-sm opacity-60"
                  style={{ color: 'hsl(38, 20%, 90%)' }}
                >
                  {category.productCount} منتج
                </p>

                {/* Hover Arrow */}
                <motion.div
                  className="mt-3 flex items-center gap-2 text-xs tracking-wide"
                  style={{ color: colors.accent }}
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 0 }}
                  animate={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                >
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                    تسوقي الآن
                  </span>
                  <ArrowUpLeft className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all group-hover:-translate-x-1" />
                </motion.div>
              </div>

              {/* Border Accent on Hover */}
              <div 
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{
                  border: `1px solid ${isDark ? 'hsla(38, 70%, 50%, 0.3)' : 'hsla(20, 70%, 40%, 0.4)'}`,
                }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
