import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Eye } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  imageUrl: string;
  price: number;
  originalPrice?: number;
  category?: string;
  rating?: number;
  isNew?: boolean;
  isSale?: boolean;
}

interface LuxuryProductGridProps {
  products: Product[];
  title?: string;
  subtitle?: string;
  onProductClick?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onAddToWishlist?: (product: Product) => void;
  wishlist?: string[];
}

const LuxuryProductCard: React.FC<{
  product: Product;
  index: number;
  onProductClick?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onAddToWishlist?: (product: Product) => void;
  isWishlisted?: boolean;
}> = ({ product, index, onProductClick, onAddToCart, onAddToWishlist, isWishlisted }) => {
  return (
    <motion.div
      className="group relative"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
    >
      {/* Image Container */}
      <div 
        className="relative aspect-[3/4] overflow-hidden cursor-pointer"
        style={{
          background: 'linear-gradient(180deg, hsl(20, 12%, 12%), hsl(20, 12%, 10%))',
          borderRadius: '4px',
        }}
        onClick={() => onProductClick?.(product)}
      >
        <motion.img
          src={product.imageUrl}
          alt={product.title}
          className="w-full h-full object-cover"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.6 }}
        />

        {/* Overlay */}
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: 'linear-gradient(180deg, transparent 40%, hsla(20, 12%, 5%, 0.8) 100%)',
          }}
        />

        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {product.isNew && (
            <span 
              className="px-3 py-1 text-[10px] tracking-widest uppercase"
              style={{ 
                background: 'hsl(38, 90%, 50%)',
                color: 'hsl(20, 12%, 5%)',
              }}
            >
              جديد
            </span>
          )}
          {product.isSale && product.originalPrice && (
            <span 
              className="px-3 py-1 text-[10px] tracking-widest uppercase"
              style={{ 
                background: 'hsl(345, 60%, 40%)',
                color: 'white',
              }}
            >
              خصم {Math.round((1 - product.price / product.originalPrice) * 100)}%
            </span>
          )}
        </div>

        {/* Quick Actions */}
        <div 
          className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0"
        >
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onAddToWishlist?.(product);
            }}
            className="p-2.5 rounded-full backdrop-blur-sm transition-colors"
            style={{
              background: isWishlisted ? 'hsl(345, 60%, 50%)' : 'hsla(20, 12%, 10%, 0.8)',
              border: '1px solid hsla(38, 30%, 50%, 0.2)',
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </motion.button>

          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onProductClick?.(product);
            }}
            className="p-2.5 rounded-full backdrop-blur-sm"
            style={{
              background: 'hsla(20, 12%, 10%, 0.8)',
              border: '1px solid hsla(38, 30%, 50%, 0.2)',
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Eye className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Add to Cart Button */}
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart?.(product);
          }}
          className="absolute bottom-4 left-4 right-4 py-3 text-xs tracking-[0.15em] uppercase opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0"
          style={{
            background: 'linear-gradient(135deg, hsl(38, 90%, 50%), hsl(43, 85%, 55%))',
            color: 'hsl(20, 12%, 5%)',
            borderRadius: '2px',
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          أضيفي للحقيبة
        </motion.button>
      </div>

      {/* Product Info */}
      <div className="pt-4 space-y-2">
        <p 
          className="text-xs tracking-[0.2em] uppercase opacity-50"
        >
          {product.category || 'أزياء السهرة'}
        </p>
        
        <h3 
          className="text-base md:text-lg cursor-pointer hover:opacity-80 transition-opacity line-clamp-1"
          style={{ fontFamily: "'Playfair Display', serif" }}
          onClick={() => onProductClick?.(product)}
        >
          {product.title}
        </h3>

        <div className="flex items-baseline gap-3">
          <span style={{ color: 'hsl(38, 80%, 55%)' }}>
            {product.price.toLocaleString()} ر.س
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-sm line-through opacity-40">
              {product.originalPrice.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const LuxuryProductGrid: React.FC<LuxuryProductGridProps> = ({
  products,
  title = 'المجموعة',
  subtitle = 'كل قطعة مصنوعة بعناية، تمزج الجماليات الشرقية التقليدية مع الأناقة المعاصرة.',
  onProductClick,
  onAddToCart,
  onAddToWishlist,
  wishlist = [],
}) => {
  return (
    <section 
      id="collection"
      className="py-20"
      style={{
        background: 'linear-gradient(180deg, hsl(20, 12%, 6%) 0%, hsl(20, 12%, 8%) 100%)',
      }}
    >
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-16 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p 
            className="text-xs tracking-[0.4em] uppercase mb-4"
            style={{ color: 'hsl(38, 80%, 55%)' }}
          >
            اختيار منسق
          </p>
          <h2 
            className="text-3xl md:text-4xl mb-6"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {title}
          </h2>
          <p className="opacity-60 leading-relaxed">
            {subtitle}
          </p>
        </motion.div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
          {products.map((product, index) => (
            <LuxuryProductCard
              key={product.id}
              product={product}
              index={index}
              onProductClick={onProductClick}
              onAddToCart={onAddToCart}
              onAddToWishlist={onAddToWishlist}
              isWishlisted={wishlist.includes(product.id)}
            />
          ))}
        </div>

        {/* View All Button */}
        {products.length >= 8 && (
          <motion.div 
            className="text-center mt-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <motion.button
              className="px-10 py-4 text-sm tracking-[0.2em] uppercase"
              style={{
                background: 'transparent',
                color: 'hsl(38, 25%, 90%)',
                border: '1px solid hsla(38, 30%, 50%, 0.3)',
                borderRadius: '2px',
              }}
              whileHover={{ 
                borderColor: 'hsla(38, 90%, 50%, 0.5)',
                boxShadow: '0 0 30px hsla(38, 90%, 50%, 0.1)' 
              }}
              whileTap={{ scale: 0.98 }}
            >
              عرض جميع القطع
            </motion.button>
          </motion.div>
        )}
      </div>
    </section>
  );
};
