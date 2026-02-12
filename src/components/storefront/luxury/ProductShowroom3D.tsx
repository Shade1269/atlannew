import React, { Suspense, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ShoppingBag, Heart, Eye, RotateCcw, Sparkles, Maximize2 } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  Environment, 
  ContactShadows, 
  PerspectiveCamera,
  Float,
  Sparkles as DreiSparkles
} from '@react-three/drei';
import * as THREE from 'three';
import { useLuxuryTheme } from './LuxuryThemeContext';

const DEFAULT_ACCENT = '#d4af37';
function parseThemeColor(hslOrHex: string | undefined): string {
  if (!hslOrHex) return DEFAULT_ACCENT;
  if (hslOrHex.startsWith('#')) return hslOrHex;
  try {
    const c = new THREE.Color();
    c.setStyle(hslOrHex);
    return '#' + c.getHexString();
  } catch {
    return DEFAULT_ACCENT;
  }
}

interface Product {
  id: string;
  title: string;
  imageUrl: string;
  price: number;
  originalPrice?: number;
  category?: string;
}

interface ProductShowroom3DProps {
  products: Product[];
  onAddToCart?: (product: Product) => void;
  onProductClick?: (product: Product) => void;
  enableExtraction?: boolean; // Enable AI product extraction
}

// Rotating platform - لون الثيم (ذهبي أو لون المتجر)
const RotatingPlatform: React.FC<{ accentColor?: string }> = ({ accentColor = DEFAULT_ACCENT }) => {
  const platformRef = useRef<THREE.Group>(null);
  const hex = parseThemeColor(accentColor);
  const innerHex = useMemo(() => {
    const c = new THREE.Color(hex);
    c.offsetHSL(0, 0, -0.05);
    return '#' + c.getHexString();
  }, [hex]);

  useFrame((_, delta) => {
    if (platformRef.current) {
      platformRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <group ref={platformRef}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]}>
        <ringGeometry args={[2.0, 2.15, 64]} />
        <meshStandardMaterial 
          color={hex} 
          metalness={0.95} 
          roughness={0.1}
          emissive={hex}
          emissiveIntensity={0.2}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]}>
        <ringGeometry args={[1.6, 1.65, 64]} />
        <meshStandardMaterial 
          color={innerHex} 
          metalness={0.9} 
          roughness={0.15}
          emissive={innerHex}
          emissiveIntensity={0.15}
        />
      </mesh>
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (Math.PI * 2 / 12) * i;
        const x = Math.cos(angle) * 1.85;
        const z = Math.sin(angle) * 1.85;
        return (
          <mesh key={i} position={[x, -1.5, z]}>
            <sphereGeometry args={[0.03, 16, 16]} />
            <meshStandardMaterial 
              color={hex} 
              metalness={0.9} 
              roughness={0.1}
              emissive={hex}
              emissiveIntensity={0.3}
            />
          </mesh>
        );
      })}
    </group>
  );
};

// 3D Dress Model - لون الثيم للزخارف الذهبية
const DressModel3D: React.FC<{ isTransitioning: boolean; accentColor?: string }> = ({ isTransitioning, accentColor = DEFAULT_ACCENT }) => {
  const groupRef = useRef<THREE.Group>(null);
  const hex = parseThemeColor(accentColor);
  
  const goldMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(hex),
    metalness: 0.9,
    roughness: 0.1,
    emissive: new THREE.Color(hex),
    emissiveIntensity: 0.1,
  }), [hex]);

  // Dress fabric material - elegant silk-like
  const fabricMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#8b0a50'),
    metalness: 0.3,
    roughness: 0.4,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: isTransitioning ? 0 : 1,
  }), [isTransitioning]);

  // Light fabric for accents
  const accentMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#f5f5dc'),
    metalness: 0.1,
    roughness: 0.6,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: isTransitioning ? 0 : 1,
  }), [isTransitioning]);

  useFrame((state) => {
    if (groupRef.current) {
      // Gentle floating animation
      groupRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.05;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
      <group ref={groupRef} position={[0, 0.3, 0]} scale={1.2}>
        {/* Dress Bodice (Top part) */}
        <mesh position={[0, 1.5, 0]} material={fabricMaterial}>
          <cylinderGeometry args={[0.4, 0.5, 0.8, 32]} />
        </mesh>
        
        {/* Bust area */}
        <mesh position={[0, 1.3, 0.1]} material={fabricMaterial}>
          <sphereGeometry args={[0.35, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        
        {/* Waist */}
        <mesh position={[0, 1.0, 0]} material={fabricMaterial}>
          <cylinderGeometry args={[0.35, 0.4, 0.3, 32]} />
        </mesh>
        
        {/* Skirt - flowing layers */}
        <mesh position={[0, 0.3, 0]} material={fabricMaterial}>
          <coneGeometry args={[1.2, 1.5, 64, 1, true]} />
        </mesh>
        
        {/* Inner skirt layer */}
        <mesh position={[0, 0.25, 0]} material={accentMaterial}>
          <coneGeometry args={[1.1, 1.4, 64, 1, true]} />
        </mesh>
        
        {/* Skirt bottom ruffle */}
        <mesh position={[0, -0.4, 0]} rotation={[Math.PI, 0, 0]} material={fabricMaterial}>
          <torusGeometry args={[1.15, 0.08, 16, 64]} />
        </mesh>
        
        {/* Gold belt/waist accent */}
        <mesh position={[0, 0.9, 0]} material={goldMaterial}>
          <torusGeometry args={[0.38, 0.03, 16, 64]} />
        </mesh>
        
        {/* Shoulder straps */}
        <mesh position={[-0.25, 1.85, 0]} rotation={[0, 0, 0.3]} material={goldMaterial}>
          <cylinderGeometry args={[0.02, 0.02, 0.4, 8]} />
        </mesh>
        <mesh position={[0.25, 1.85, 0]} rotation={[0, 0, -0.3]} material={goldMaterial}>
          <cylinderGeometry args={[0.02, 0.02, 0.4, 8]} />
        </mesh>
        
        {/* Neckline decoration */}
        <mesh position={[0, 1.7, 0.15]} material={goldMaterial}>
          <torusGeometry args={[0.15, 0.015, 16, 32, Math.PI]} />
        </mesh>
        
        {/* Dress hem sparkles/gems */}
        {[...Array(8)].map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[
                Math.cos(angle) * 1.1,
                -0.35,
                Math.sin(angle) * 1.1
              ]}
              material={goldMaterial}
            >
              <sphereGeometry args={[0.03, 16, 16]} />
            </mesh>
          );
        })}
        
        {/* Floating particles around dress */}
        {[...Array(12)].map((_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          const radius = 1.5 + Math.random() * 0.3;
          const height = Math.random() * 2 - 0.5;
          return (
            <mesh
              key={`particle-${i}`}
              position={[
                Math.cos(angle) * radius,
                height,
                Math.sin(angle) * radius
              ]}
            >
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshStandardMaterial
                color={hex}
                emissive={hex}
                emissiveIntensity={0.5}
                transparent
                opacity={isTransitioning ? 0 : 0.7}
              />
            </mesh>
          );
        })}
      </group>
    </Float>
  );
};

// إضاءة الاستوديو - لون الثيم للأكسنت
const StudioLighting: React.FC<{ accentColor?: string }> = ({ accentColor = DEFAULT_ACCENT }) => {
  const hex = parseThemeColor(accentColor);
  return (
    <>
      <spotLight
        position={[5, 8, 5]}
        angle={0.4}
        penumbra={0.5}
        intensity={2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        color="#fff8f0"
      />
      <spotLight
        position={[-6, 4, 3]}
        angle={0.5}
        penumbra={0.8}
        intensity={1}
        color="#f5e6d3"
      />
      <spotLight
        position={[0, 5, -5]}
        angle={0.3}
        penumbra={0.5}
        intensity={1.5}
        color={hex}
      />
      <ambientLight intensity={0.25} />
      <pointLight 
        position={[0, -1, 0]} 
        intensity={0.5} 
        color={hex}
        distance={5}
      />
      <pointLight position={[3, 1, 0]} intensity={0.3} color="#fff5e6" distance={6} />
      <pointLight position={[-3, 1, 0]} intensity={0.3} color="#fff5e6" distance={6} />
    </>
  );
};

// جزيئات متلألئة بلون الثيم
const GoldSparkles: React.FC<{ accentColor?: string }> = ({ accentColor = DEFAULT_ACCENT }) => {
  const hex = parseThemeColor(accentColor);
  return (
    <DreiSparkles
      count={40}
      size={3}
      scale={[8, 6, 8]}
      position={[0, 1, 0]}
      speed={0.3}
      color={hex}
      opacity={0.6}
    />
  );
};

// المشهد الرئيسي لصالة العرض - يستقبل لون الثيم
const ShowroomScene: React.FC<{ 
  isTransitioning: boolean;
  accentColor?: string;
}> = ({ isTransitioning, accentColor }) => {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 1.5, 6]} fov={35} />
      
      <StudioLighting accentColor={accentColor} />
      
      <Suspense fallback={null}>
        <RotatingPlatform accentColor={accentColor} />
        <DressModel3D isTransitioning={isTransitioning} accentColor={accentColor} />
        <GoldSparkles accentColor={accentColor} />
      </Suspense>
      
      <ContactShadows
        position={[0, -1.49, 0]}
        opacity={0.6}
        scale={10}
        blur={2.5}
        far={4}
        color="#000"
      />
      
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={4}
        maxDistance={10}
        minPolarAngle={Math.PI * 0.2}
        maxPolarAngle={Math.PI * 0.6}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
      />
      
      <Environment preset="studio" background={false} />
      
      {/* Background gradient sphere */}
      <mesh scale={50}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#0a0806" side={THREE.BackSide} />
      </mesh>
    </>
  );
};

export const ProductShowroom3D: React.FC<ProductShowroom3DProps> = ({
  products,
  onAddToCart,
  onProductClick,
}) => {
  const { colors } = useLuxuryTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const accentColor = colors.accent || colors.primary;
  const currentProduct = products[currentIndex];

  const handleNav = (direction: 'prev' | 'next') => {
    setIsTransitioning(true);
    setTimeout(() => {
      if (direction === 'prev') {
        setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
      } else {
        setCurrentIndex((prev) => (prev + 1) % products.length);
      }
      setTimeout(() => setIsTransitioning(false), 300);
    }, 200);
  };

  if (!products.length) return null;

  return (
    <section 
      className="py-16 md:py-24 relative overflow-hidden"
      style={{
        background: colors.gradientSection || `
          radial-gradient(ellipse 100% 60% at 50% 20%, hsla(38, 40%, 10%, 0.4) 0%, transparent 60%),
          linear-gradient(180deg, hsl(20, 15%, 5%) 0%, hsl(20, 12%, 4%) 100%)
        `,
      }}
    >
      <div 
        className="absolute top-0 left-0 w-full h-px"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${accentColor} 50%, transparent 100%)`,
        }}
      />
      
      <div className="container mx-auto px-4 md:px-6">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-px flex-1 max-w-[3rem]" style={{ background: `linear-gradient(90deg, transparent, ${colors.accentMuted || accentColor})` }} />
            <Sparkles className="w-5 h-5 shrink-0" style={{ color: accentColor }} />
            <div className="w-12 h-px flex-1 max-w-[3rem]" style={{ background: `linear-gradient(90deg, ${colors.accentMuted || accentColor}, transparent)` }} />
          </div>
          <p 
            className="text-xs tracking-[0.4em] uppercase mb-3"
            style={{ color: accentColor }}
          >
            عرض تفاعلي ثلاثي الأبعاد
          </p>
          <h2 
            className="text-3xl md:text-5xl"
            style={{ fontFamily: "'Playfair Display', serif", color: colors.text }}
          >
            صالة العرض الفاخرة
          </h2>
          <p className="mt-4 opacity-50 text-sm max-w-md mx-auto" style={{ color: colors.textMuted }}>
            استمتعي بتجربة فريدة في استعراض منتجاتنا بتقنية ثلاثية الأبعاد
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* 3D Canvas */}
          <motion.div 
            className={`relative rounded-2xl overflow-hidden ${
              isFullscreen 
                ? 'fixed inset-4 z-50 max-w-none' 
                : 'aspect-square max-w-xl mx-auto w-full'
            }`}
            style={{
              background: colors.gradientCard || 'radial-gradient(ellipse at center, hsla(30, 20%, 8%, 1) 0%, hsla(20, 15%, 4%, 1) 100%)',
              border: `1px solid ${colors.borderAccent || accentColor}`,
              boxShadow: `0 40px 100px hsla(0, 0%, 0%, 0.6), inset 0 1px 0 ${colors.accentGlow || accentColor}`,
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            {/* Corner decorations - لون الثيم */}
            <div className="absolute top-0 left-0 w-16 h-16 border-t border-l rounded-tl-2xl pointer-events-none" style={{ borderColor: colors.borderAccent || accentColor }} />
            <div className="absolute top-0 right-0 w-16 h-16 border-t border-r rounded-tr-2xl pointer-events-none" style={{ borderColor: colors.borderAccent || accentColor }} />
            <div className="absolute bottom-0 left-0 w-16 h-16 border-b border-l rounded-bl-2xl pointer-events-none" style={{ borderColor: colors.borderAccent || accentColor }} />
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b border-r rounded-br-2xl pointer-events-none" style={{ borderColor: colors.borderAccent || accentColor }} />

            {/* Transition Overlay */}
            <AnimatePresence>
              {isTransitioning && (
                <motion.div
                  className="absolute inset-0 z-20"
                  style={{ 
                    background: colors.backgroundOverlay || 'radial-gradient(circle at center, hsla(38, 30%, 8%, 0.9), hsla(20, 15%, 4%, 0.95))'
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              )}
            </AnimatePresence>

            {/* 3D Canvas */}
            <Canvas 
              shadows 
              className="w-full h-full"
              gl={{ antialias: true, alpha: true }}
              dpr={[1, 2]}
            >
              <ShowroomScene 
                isTransitioning={isTransitioning}
                accentColor={accentColor}
              />
            </Canvas>

            {/* Fullscreen toggle */}
            <motion.button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="absolute top-4 right-4 p-2 rounded-lg z-10"
              style={{
                background: colors.backgroundInput || 'hsla(20, 12%, 8%, 0.9)',
                border: `1px solid ${colors.borderAccent || accentColor}`,
              }}
              whileHover={{ scale: 1.1, borderColor: colors.borderHover || accentColor }}
              whileTap={{ scale: 0.95 }}
            >
              <Maximize2 className="w-4 h-4 opacity-70" style={{ color: accentColor }} />
            </motion.button>

            {/* Drag Hint */}
            <motion.div 
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full z-10"
              style={{
                background: colors.backgroundInput || 'hsla(20, 12%, 6%, 0.9)',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${colors.borderAccent || accentColor}`,
                color: colors.textMuted,
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              <RotateCcw className="w-3 h-3" style={{ color: accentColor }} />
              <span className="text-[10px] tracking-widest uppercase opacity-70">
                اسحبي للدوران • سكرول للتكبير
              </span>
            </motion.div>

            {/* Navigation */}
            {products.length > 1 && (
              <>
                <motion.button
                  onClick={() => handleNav('prev')}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full z-10"
                  style={{ 
                    background: colors.backgroundInput || 'hsla(20, 12%, 6%, 0.9)',
                    border: `1px solid ${colors.borderAccent || accentColor}`,
                    backdropFilter: 'blur(10px)',
                  }}
                  whileHover={{ scale: 1.1, borderColor: colors.borderHover || accentColor }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ChevronLeft className="w-5 h-5" style={{ color: accentColor }} />
                </motion.button>
                <motion.button
                  onClick={() => handleNav('next')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full z-10"
                  style={{ 
                    background: colors.backgroundInput || 'hsla(20, 12%, 6%, 0.9)',
                    border: `1px solid ${colors.borderAccent || accentColor}`,
                    backdropFilter: 'blur(10px)',
                  }}
                  whileHover={{ scale: 1.1, borderColor: colors.borderHover || accentColor }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ChevronRight className="w-5 h-5" style={{ color: accentColor }} />
                </motion.button>
              </>
            )}

            {/* Product counter */}
            <div 
              className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs z-10"
              style={{
                background: colors.backgroundInput || 'hsla(20, 12%, 6%, 0.9)',
                border: `1px solid ${colors.borderAccent || accentColor}`,
                color: colors.text,
              }}
            >
              <span style={{ color: accentColor }}>{currentIndex + 1}</span>
              <span className="mx-1 opacity-40">/</span>
              <span className="opacity-70">{products.length}</span>
            </div>
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
                transition={{ duration: 0.4 }}
              >
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
                  <span 
                    className="px-3 py-1 rounded-full text-[10px] tracking-widest uppercase"
                    style={{
                      background: colors.accentMuted || 'hsla(38, 80%, 50%, 0.15)',
                      color: accentColor,
                      border: `1px solid ${colors.borderAccent || accentColor}`,
                    }}
                  >
                    {currentProduct.category || 'مجموعة فاخرة'}
                  </span>
                </div>

                <h3 
                  className="text-3xl md:text-4xl lg:text-5xl mb-4"
                  style={{ fontFamily: "'Playfair Display', serif", color: colors.text }}
                >
                  {currentProduct.title}
                </h3>

                <div className="flex items-baseline justify-center lg:justify-start gap-3 mb-6">
                  <span 
                    className="text-3xl md:text-4xl font-light"
                    style={{ color: accentColor }}
                  >
                    {currentProduct.price.toLocaleString()} ر.س
                  </span>
                  {currentProduct.originalPrice && (
                    <span className="text-xl line-through opacity-40" style={{ color: colors.textMuted }}>
                      {currentProduct.originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>

                <p className="mb-8 max-w-md mx-auto lg:mx-0 leading-relaxed opacity-70" style={{ color: colors.textMuted }}>
                  قطعة فريدة مصممة بعناية فائقة، تجمع بين الأناقة الشرقية والرقي العصري.
                  استمتعي بتجربة العرض التفاعلي لاستكشاف كل التفاصيل.
                </p>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-8">
                  <motion.button
                    onClick={() => onAddToCart?.(currentProduct)}
                    className="px-8 py-4 text-sm font-medium tracking-wide flex items-center gap-2 rounded-lg"
                    style={{
                      background: colors.buttonPrimary || colors.gradientGold || accentColor,
                      color: colors.primaryText || colors.buttonText,
                      boxShadow: colors.shadowPrimary || `0 10px 40px ${accentColor}`,
                    }}
                    whileHover={{ scale: 1.03, boxShadow: colors.shadowPrimary || `0 15px 50px ${accentColor}` }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    أضيفي للسلة
                  </motion.button>

                  <motion.button
                    className="p-4 rounded-lg"
                    style={{
                      border: `1px solid ${colors.borderAccent || accentColor}`,
                      background: colors.buttonSecondary || 'transparent',
                      color: accentColor,
                    }}
                    whileHover={{ 
                      borderColor: colors.borderHover || accentColor,
                      background: colors.accentMuted || 'transparent'
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Heart className="w-5 h-5" />
                  </motion.button>

                  <motion.button
                    onClick={() => onProductClick?.(currentProduct)}
                    className="p-4 rounded-lg"
                    style={{
                      border: `1px solid ${colors.borderAccent || accentColor}`,
                      background: colors.buttonSecondary || 'transparent',
                      color: accentColor,
                    }}
                    whileHover={{ 
                      borderColor: colors.borderHover || accentColor,
                      background: colors.accentMuted || 'transparent'
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Eye className="w-5 h-5" />
                  </motion.button>
                </div>

                {/* Thumbnails */}
                <div className="flex items-center justify-center lg:justify-start gap-3">
                  {products.slice(0, 6).map((product, index) => (
                    <motion.button
                      key={product.id}
                      onClick={() => {
                        if (index !== currentIndex) {
                          setIsTransitioning(true);
                          setTimeout(() => {
                            setCurrentIndex(index);
                            setTimeout(() => setIsTransitioning(false), 300);
                          }, 200);
                        }
                      }}
                      className="relative rounded-lg overflow-hidden"
                      style={{
                        width: 60,
                        height: 75,
                        border: currentIndex === index 
                          ? `2px solid ${accentColor}`
                          : `1px solid ${colors.border || colors.borderAccent}`,
                        opacity: currentIndex === index ? 1 : 0.5,
                        boxShadow: currentIndex === index 
                          ? (colors.shadowPrimary || `0 5px 20px ${accentColor}`)
                          : 'none',
                      }}
                      whileHover={{ opacity: 1, scale: 1.05 }}
                    >
                      <img 
                        src={product.imageUrl} 
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                      {currentIndex === index && (
                        <motion.div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: `linear-gradient(180deg, transparent 50%, ${colors.accentGlow || accentColor} 100%)`,
                          }}
                          layoutId="activeThumb"
                        />
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Fullscreen overlay */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsFullscreen(false)}
          />
        )}
      </AnimatePresence>
    </section>
  );
};
