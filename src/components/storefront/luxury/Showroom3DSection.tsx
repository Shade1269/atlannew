import React, { Suspense, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ShoppingBag, Heart, Eye, RotateCcw } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, PerspectiveCamera } from '@react-three/drei';
import { GoldenParticles } from './GoldenParticles';

interface Product {
  id: string;
  title: string;
  imageUrl: string;
  price: number;
  originalPrice?: number;
  category?: string;
}

interface Showroom3DSectionProps {
  products: Product[];
  onAddToCart?: (product: Product) => void;
  onProductClick?: (product: Product) => void;
}

// Simple 3D Display Component
const ProductDisplay: React.FC<{ imageUrl: string }> = () => {
  return (
    <>
      {/* Stage */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
        <circleGeometry args={[3, 64]} />
        <meshStandardMaterial color="#1a1510" roughness={0.8} />
      </mesh>

      {/* Gold ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.48, 0]}>
        <ringGeometry args={[2.8, 2.9, 64]} />
        <meshStandardMaterial 
          color="#c9a040" 
          metalness={0.8} 
          roughness={0.2}
          emissive="#c9a040"
          emissiveIntensity={0.1}
        />
      </mesh>

      <ContactShadows
        position={[0, -1.49, 0]}
        opacity={0.5}
        scale={8}
        blur={2}
        far={3}
      />

      <GoldenParticles count={20} spread={6} />

      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <spotLight position={[5, 8, 5]} angle={0.3} intensity={1.5} castShadow />
      <spotLight position={[-5, 5, 3]} angle={0.4} intensity={0.8} color="#fff8f0" />
      <pointLight position={[0, -1, 0]} intensity={0.3} color="#c9a040" />
    </>
  );
};

export const Showroom3DSection: React.FC<Showroom3DSectionProps> = ({
  products,
  onAddToCart,
  onProductClick,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const currentProduct = products[currentIndex];

  const handleNav = (direction: 'prev' | 'next') => {
    setIsTransitioning(true);
    setTimeout(() => {
      if (direction === 'prev') {
        setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
      } else {
        setCurrentIndex((prev) => (prev + 1) % products.length);
      }
      setTimeout(() => setIsTransitioning(false), 200);
    }, 150);
  };

  if (!products.length) return null;

  return (
    <section 
      className="py-16 md:py-24"
      style={{
        background: `
          radial-gradient(ellipse 80% 50% at 50% 30%, hsla(30, 30%, 12%, 0.5) 0%, transparent 50%),
          linear-gradient(180deg, hsl(20, 12%, 6%) 0%, hsl(20, 12%, 5%) 100%)
        `,
      }}
    >
      <div className="container mx-auto px-4 md:px-6">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p 
            className="text-xs tracking-[0.4em] uppercase mb-3"
            style={{ color: 'hsl(38, 80%, 55%)' }}
          >
            تجربة تفاعلية
          </p>
          <h2 
            className="text-2xl md:text-4xl"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            صالة العرض الفاخرة
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* 3D Canvas */}
          <motion.div 
            className="relative aspect-square max-w-lg mx-auto w-full rounded-2xl overflow-hidden"
            style={{
              background: 'radial-gradient(ellipse at center, hsla(30, 20%, 12%, 1) 0%, hsla(20, 12%, 6%, 1) 100%)',
              border: '1px solid hsla(38, 30%, 25%, 0.2)',
              boxShadow: '0 30px 80px hsla(0, 0%, 0%, 0.5)',
            }}
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            {/* Transition Overlay */}
            <AnimatePresence>
              {isTransitioning && (
                <motion.div
                  className="absolute inset-0 z-10"
                  style={{ background: 'hsl(20, 12%, 6%)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  exit={{ opacity: 0 }}
                />
              )}
            </AnimatePresence>

            {/* Product Image as Background */}
            <motion.img
              key={currentProduct.id}
              src={currentProduct.imageUrl}
              alt={currentProduct.title}
              className="absolute inset-0 w-full h-full object-cover"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            />

            {/* Dark Overlay for 3D effect */}
            <div 
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(ellipse at center, transparent 40%, hsla(20, 12%, 6%, 0.8) 100%)',
              }}
            />

            {/* 3D Canvas */}
            <Canvas shadows className="relative z-[1]">
              <PerspectiveCamera makeDefault position={[0, 0.5, 5]} fov={40} />
              <Suspense fallback={null}>
                <ProductDisplay imageUrl={currentProduct.imageUrl} />
              </Suspense>
              <OrbitControls
                enablePan={false}
                enableZoom={false}
                minPolarAngle={Math.PI * 0.25}
                maxPolarAngle={Math.PI * 0.65}
                enableDamping
                dampingFactor={0.05}
                rotateSpeed={0.5}
              />
              <Environment preset="studio" background={false} />
            </Canvas>

            {/* Drag Hint */}
            <div 
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full z-10"
              style={{
                background: 'hsla(20, 12%, 8%, 0.85)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <RotateCcw className="w-3 h-3 text-amber-500/60" />
              <span className="text-[10px] tracking-widest uppercase opacity-50">
                اسحبي للدوران
              </span>
            </div>

            {/* Navigation */}
            {products.length > 1 && (
              <>
                <motion.button
                  onClick={() => handleNav('prev')}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full z-10"
                  style={{ 
                    background: 'hsla(20, 12%, 8%, 0.9)',
                    border: '1px solid hsla(38, 40%, 40%, 0.2)',
                  }}
                  whileHover={{ scale: 1.1, borderColor: 'hsla(38, 80%, 50%, 0.5)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ChevronLeft className="w-5 h-5 text-amber-500/70" />
                </motion.button>
                <motion.button
                  onClick={() => handleNav('next')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full z-10"
                  style={{ 
                    background: 'hsla(20, 12%, 8%, 0.9)',
                    border: '1px solid hsla(38, 40%, 40%, 0.2)',
                  }}
                  whileHover={{ scale: 1.1, borderColor: 'hsla(38, 80%, 50%, 0.5)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ChevronRight className="w-5 h-5 text-amber-500/70" />
                </motion.button>
              </>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div
            className="text-center lg:text-right"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentProduct.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <p 
                  className="text-xs tracking-[0.3em] uppercase mb-3"
                  style={{ color: 'hsl(38, 70%, 50%)' }}
                >
                  {currentProduct.category || 'مجموعة فاخرة'}
                </p>

                <h3 
                  className="text-3xl md:text-4xl lg:text-5xl mb-4"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {currentProduct.title}
                </h3>

                <div className="flex items-baseline justify-center lg:justify-start gap-3 mb-6">
                  <span 
                    className="text-3xl md:text-4xl font-light"
                    style={{ color: 'hsl(38, 85%, 55%)' }}
                  >
                    {currentProduct.price.toLocaleString()} ر.س
                  </span>
                  {currentProduct.originalPrice && (
                    <span className="text-xl line-through opacity-40">
                      {currentProduct.originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>

                <p className="opacity-60 mb-8 max-w-md mx-auto lg:mx-0">
                  قطعة فريدة مصممة بعناية فائقة، تجمع بين الأناقة الشرقية والرقي العصري.
                </p>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                  <motion.button
                    onClick={() => onAddToCart?.(currentProduct)}
                    className="px-8 py-4 text-sm font-medium tracking-wide flex items-center gap-2 rounded-lg"
                    style={{
                      background: 'linear-gradient(135deg, hsl(38, 90%, 50%), hsl(43, 85%, 50%))',
                      color: 'hsl(20, 15%, 8%)',
                      boxShadow: '0 10px 40px hsla(38, 90%, 45%, 0.3)',
                    }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    أضيفي للسلة
                  </motion.button>

                  <motion.button
                    className="p-4 rounded-lg"
                    style={{
                      border: '1px solid hsla(38, 40%, 40%, 0.3)',
                    }}
                    whileHover={{ borderColor: 'hsla(38, 80%, 50%, 0.5)' }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Heart className="w-5 h-5" />
                  </motion.button>

                  <motion.button
                    onClick={() => onProductClick?.(currentProduct)}
                    className="p-4 rounded-lg"
                    style={{
                      border: '1px solid hsla(38, 40%, 40%, 0.3)',
                    }}
                    whileHover={{ borderColor: 'hsla(38, 80%, 50%, 0.5)' }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Eye className="w-5 h-5" />
                  </motion.button>
                </div>

                {/* Thumbnails */}
                <div className="flex items-center justify-center lg:justify-start gap-3 mt-10">
                  {products.slice(0, 5).map((product, index) => (
                    <motion.button
                      key={product.id}
                      onClick={() => {
                        setIsTransitioning(true);
                        setTimeout(() => {
                          setCurrentIndex(index);
                          setTimeout(() => setIsTransitioning(false), 200);
                        }, 150);
                      }}
                      className="w-16 h-20 md:w-20 md:h-24 rounded-lg overflow-hidden"
                      style={{
                        border: currentIndex === index 
                          ? '2px solid hsl(38, 80%, 50%)'
                          : '1px solid hsla(38, 30%, 30%, 0.2)',
                        opacity: currentIndex === index ? 1 : 0.6,
                      }}
                      whileHover={{ opacity: 1, scale: 1.05 }}
                    >
                      <img 
                        src={product.imageUrl} 
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
