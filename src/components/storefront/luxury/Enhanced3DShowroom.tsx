import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, useTexture, PerspectiveCamera, Float, Sparkles as DreiSparkles } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { ChevronLeft, ChevronRight, RotateCcw, ZoomIn, Maximize2 } from 'lucide-react';
import { GoldenParticles } from './GoldenParticles';

interface Product {
  id: string;
  title: string;
  imageUrl: string;
  price: number;
  originalPrice?: number;
  category?: string;
  isNew?: boolean;
  isSale?: boolean;
}

interface Enhanced3DShowroomProps {
  products: Product[];
  selectedIndex?: number;
  onProductChange?: (index: number) => void;
  onAddToBag?: (product: Product) => void;
}

// Enhanced Dress Mannequin with better geometry
const EnhancedDressMannequin: React.FC<{ imageUrl: string; isTransitioning: boolean }> = ({ 
  imageUrl, 
  isTransitioning 
}) => {
  const meshRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  
  const texture = useTexture(imageUrl, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.repeat.set(1, 1);
  });

  // Smooth idle animation
  useFrame((state) => {
    if (meshRef.current && !isTransitioning) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
    }
  });

  // Create elegant dress silhouette
  const dressShape = React.useMemo(() => {
    const points = [];
    const segments = 60;
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      let radius;
      
      // Create feminine silhouette
      if (t < 0.08) {
        // Neck
        radius = 0.12 + t * 0.4;
      } else if (t < 0.18) {
        // Shoulders
        radius = 0.44 + Math.sin((t - 0.08) * Math.PI / 0.1) * 0.08;
      } else if (t < 0.35) {
        // Upper torso/bust
        const bustT = (t - 0.18) / 0.17;
        radius = 0.52 + Math.sin(bustT * Math.PI) * 0.12;
      } else if (t < 0.45) {
        // Waist (narrowest)
        const waistT = (t - 0.35) / 0.1;
        radius = 0.52 - Math.sin(waistT * Math.PI) * 0.18;
      } else if (t < 0.55) {
        // Hips
        const hipT = (t - 0.45) / 0.1;
        radius = 0.38 + Math.sin(hipT * Math.PI * 0.5) * 0.18;
      } else {
        // Flowing skirt
        const skirtT = (t - 0.55) / 0.45;
        radius = 0.56 + skirtT * 0.9 + Math.sin(skirtT * Math.PI * 2) * 0.05;
      }
      
      points.push(new THREE.Vector2(radius, (t - 0.5) * 4.5));
    }
    return new THREE.LatheGeometry(points, 72);
  }, []);

  return (
    <Float speed={0.5} rotationIntensity={0.1} floatIntensity={0.2}>
      <group ref={meshRef} position={[0, 0, 0]}>
        {/* Main Dress */}
        <mesh geometry={dressShape} castShadow receiveShadow>
          <meshStandardMaterial
            ref={materialRef}
            map={texture}
            side={THREE.DoubleSide}
            roughness={0.85}
            metalness={0}
            envMapIntensity={0.2}
          />
        </mesh>
        
        {/* Inner shadow for depth */}
        <mesh geometry={dressShape} scale={[0.97, 0.995, 0.97]}>
          <meshStandardMaterial
            color="#15100a"
            side={THREE.BackSide}
            transparent
            opacity={0.4}
          />
        </mesh>

        {/* Subtle highlight rim */}
        <mesh geometry={dressShape} scale={[1.01, 1.001, 1.01]}>
          <meshBasicMaterial
            color="#d4a853"
            transparent
            opacity={0.03}
            side={THREE.FrontSide}
          />
        </mesh>
      </group>
    </Float>
  );
};

// Premium Studio Lighting
const PremiumLighting: React.FC = () => {
  return (
    <>
      {/* Key Light - Warm main */}
      <spotLight
        position={[4, 10, 8]}
        angle={0.35}
        penumbra={0.9}
        intensity={2.5}
        color="#fff8f0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
      />
      
      {/* Fill Light - Cool left */}
      <spotLight
        position={[-7, 5, 5]}
        angle={0.5}
        penumbra={1}
        intensity={1}
        color="#e8f0ff"
      />
      
      {/* Fill Light - Warm right */}
      <spotLight
        position={[7, 5, 3]}
        angle={0.5}
        penumbra={1}
        intensity={0.9}
        color="#fff0e0"
      />
      
      {/* Rim/Hair Light - Golden back */}
      <spotLight
        position={[0, 8, -10]}
        angle={0.4}
        penumbra={0.6}
        intensity={2}
        color="#ffcc70"
      />
      
      {/* Under glow */}
      <pointLight
        position={[0, -3, 0]}
        intensity={0.3}
        color="#c9a040"
      />
      
      {/* Ambient */}
      <ambientLight intensity={0.15} color="#1a1510" />
    </>
  );
};

// Luxury Stage Platform
const LuxuryStage: React.FC = () => {
  return (
    <>
      {/* Main floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.25, 0]} receiveShadow>
        <circleGeometry args={[10, 64]} />
        <meshStandardMaterial
          color="#0f0c08"
          roughness={0.95}
          metalness={0.05}
        />
      </mesh>
      
      {/* Raised platform */}
      <mesh position={[0, -2.2, 0]}>
        <cylinderGeometry args={[3, 3.2, 0.15, 64]} />
        <meshStandardMaterial
          color="#1a1510"
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      
      {/* Gold accent ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.12, 0]}>
        <ringGeometry args={[2.95, 3.05, 64]} />
        <meshStandardMaterial
          color="#c9a040"
          roughness={0.3}
          metalness={0.7}
          emissive="#c9a040"
          emissiveIntensity={0.1}
        />
      </mesh>
      
      {/* Contact shadow */}
      <ContactShadows
        position={[0, -2.1, 0]}
        opacity={0.7}
        scale={12}
        blur={2.5}
        far={5}
        color="#050403"
      />
      
      {/* Ambient glow on floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.09, 0]}>
        <ringGeometry args={[2, 4, 64]} />
        <meshBasicMaterial
          color="#c9a040"
          transparent
          opacity={0.02}
        />
      </mesh>
    </>
  );
};

// Camera controller with smooth transitions
const SmoothCamera: React.FC<{ isZoomed: boolean }> = ({ isZoomed }) => {
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3(0, 0.5, isZoomed ? 4 : 6));
  
  useEffect(() => {
    targetPosition.current.z = isZoomed ? 4 : 6;
  }, [isZoomed]);
  
  useFrame(() => {
    camera.position.lerp(targetPosition.current, 0.05);
    camera.lookAt(0, 0, 0);
  });
  
  return null;
};

// Scene Component
const Scene3D: React.FC<{ 
  product: Product; 
  isTransitioning: boolean;
  isZoomed: boolean;
}> = ({ product, isTransitioning, isZoomed }) => {
  return (
    <>
      <SmoothCamera isZoomed={isZoomed} />
      <PremiumLighting />
      <LuxuryStage />
      
      {/* Golden dust particles */}
      <GoldenParticles count={40} spread={10} />
      
      {/* Drei sparkles for magic effect */}
      <DreiSparkles
        count={30}
        scale={8}
        size={2}
        speed={0.3}
        opacity={0.3}
        color="#d4a853"
      />
      
      <Suspense fallback={null}>
        <EnhancedDressMannequin 
          imageUrl={product.imageUrl} 
          isTransitioning={isTransitioning} 
        />
      </Suspense>
      
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={3.5}
        maxDistance={12}
        minPolarAngle={Math.PI * 0.15}
        maxPolarAngle={Math.PI * 0.75}
        enableDamping
        dampingFactor={0.03}
        rotateSpeed={0.4}
      />
      
      <Environment preset="studio" background={false} />
    </>
  );
};

// Main Component
export const Enhanced3DShowroom: React.FC<Enhanced3DShowroomProps> = ({
  products,
  selectedIndex = 0,
  onProductChange,
  onAddToBag,
}) => {
  const [currentIndex, setCurrentIndex] = useState(selectedIndex);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const currentProduct = products[currentIndex];

  const handleProductChange = (newIndex: number) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(newIndex);
      onProductChange?.(newIndex);
      setTimeout(() => setIsTransitioning(false), 300);
    }, 200);
  };

  const handlePrev = () => {
    const newIndex = (currentIndex - 1 + products.length) % products.length;
    handleProductChange(newIndex);
  };

  const handleNext = () => {
    const newIndex = (currentIndex + 1) % products.length;
    handleProductChange(newIndex);
  };

  if (!products.length || !currentProduct) return null;

  return (
    <section 
      id="showroom"
      className="min-h-screen py-24 relative"
      style={{
        background: `
          radial-gradient(ellipse 120% 80% at 50% 30%, hsla(30, 35%, 10%, 0.9) 0%, transparent 50%),
          radial-gradient(ellipse 60% 40% at 80% 70%, hsla(25, 30%, 8%, 0.5) 0%, transparent 40%),
          linear-gradient(180deg, hsl(20, 12%, 5%) 0%, hsl(20, 14%, 7%) 50%, hsl(20, 12%, 5%) 100%)
        `,
      }}
    >
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-flex items-center gap-3 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-amber-500/50" />
            <p 
              className="text-xs tracking-[0.5em] uppercase"
              style={{ color: 'hsl(38, 85%, 58%)' }}
            >
              تجربة غامرة
            </p>
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-amber-500/50" />
          </motion.div>
          
          <h2 
            className="text-4xl md:text-5xl lg:text-6xl"
            style={{ 
              fontFamily: "'Playfair Display', serif",
              color: 'hsl(38, 20%, 90%)',
              textShadow: '0 4px 20px hsla(38, 80%, 50%, 0.1)'
            }}
          >
            صالة العرض 360°
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
          {/* 3D Canvas */}
          <motion.div 
            className="relative aspect-[3/4] lg:aspect-[4/5] rounded-lg overflow-hidden"
            style={{
              background: 'radial-gradient(ellipse at center, hsla(30, 25%, 10%, 1) 0%, hsla(20, 12%, 6%, 1) 100%)',
              boxShadow: `
                0 50px 100px hsla(0, 0%, 0%, 0.6),
                0 0 0 1px hsla(38, 40%, 30%, 0.1),
                inset 0 0 100px hsla(38, 50%, 20%, 0.05)
              `,
            }}
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: 'easeOut' }}
          >
            {/* Transition overlay */}
            <AnimatePresence>
              {isTransitioning && (
                <motion.div
                  className="absolute inset-0 z-10"
                  style={{ background: 'hsl(20, 12%, 6%)' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.8 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </AnimatePresence>

            <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
              <PerspectiveCamera makeDefault position={[0, 0.5, 6]} fov={42} />
              <Scene3D 
                product={currentProduct} 
                isTransitioning={isTransitioning}
                isZoomed={isZoomed}
              />
            </Canvas>

            {/* Controls overlay */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <motion.button
                onClick={() => setIsZoomed(!isZoomed)}
                className="p-2.5 rounded-lg backdrop-blur-md"
                style={{
                  background: 'hsla(20, 12%, 10%, 0.7)',
                  border: '1px solid hsla(38, 30%, 40%, 0.3)',
                }}
                whileHover={{ scale: 1.1, borderColor: 'hsla(38, 80%, 50%, 0.5)' }}
                whileTap={{ scale: 0.95 }}
              >
                <ZoomIn className="w-4 h-4 text-amber-500/70" />
              </motion.button>
            </div>

            {/* Drag hint */}
            <motion.div 
              className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-full"
              style={{
                background: 'hsla(20, 12%, 8%, 0.8)',
                backdropFilter: 'blur(10px)',
                border: '1px solid hsla(38, 30%, 30%, 0.2)',
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              <RotateCcw className="w-3 h-3 text-amber-500/60" />
              <span className="text-[10px] tracking-[0.2em] uppercase opacity-50">
                اسحبي للدوران
              </span>
              <Maximize2 className="w-3 h-3 text-amber-500/60" />
            </motion.div>

            {/* Navigation Arrows */}
            {products.length > 1 && (
              <>
                <motion.button
                  onClick={handlePrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-4 rounded-full"
                  style={{ 
                    background: 'hsla(20, 12%, 8%, 0.85)',
                    border: '1px solid hsla(38, 40%, 40%, 0.3)',
                    backdropFilter: 'blur(10px)',
                  }}
                  whileHover={{ 
                    scale: 1.1, 
                    borderColor: 'hsla(38, 90%, 50%, 0.5)',
                    boxShadow: '0 0 30px hsla(38, 90%, 50%, 0.2)'
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ChevronLeft className="w-5 h-5 text-amber-500/80" />
                </motion.button>
                <motion.button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-4 rounded-full"
                  style={{ 
                    background: 'hsla(20, 12%, 8%, 0.85)',
                    border: '1px solid hsla(38, 40%, 40%, 0.3)',
                    backdropFilter: 'blur(10px)',
                  }}
                  whileHover={{ 
                    scale: 1.1, 
                    borderColor: 'hsla(38, 90%, 50%, 0.5)',
                    boxShadow: '0 0 30px hsla(38, 90%, 50%, 0.2)'
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ChevronRight className="w-5 h-5 text-amber-500/80" />
                </motion.button>
              </>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            {/* Category & Badges */}
            <div className="flex items-center gap-4">
              <span 
                className="text-xs tracking-[0.4em] uppercase"
                style={{ color: 'hsla(38, 30%, 60%, 0.7)' }}
              >
                {currentProduct.category || 'أزياء السهرة'}
              </span>
              {currentProduct.isNew && (
                <span 
                  className="px-3 py-1.5 text-[10px] tracking-widest uppercase"
                  style={{ 
                    background: 'linear-gradient(135deg, hsl(38, 90%, 50%), hsl(45, 85%, 55%))',
                    color: 'hsl(20, 15%, 8%)',
                    borderRadius: '2px',
                  }}
                >
                  جديد
                </span>
              )}
              {currentProduct.isSale && (
                <span 
                  className="px-3 py-1.5 text-[10px] tracking-widest uppercase"
                  style={{ 
                    background: 'hsl(345, 65%, 45%)',
                    color: 'white',
                    borderRadius: '2px',
                  }}
                >
                  تخفيض
                </span>
              )}
            </div>

            {/* Title */}
            <AnimatePresence mode="wait">
              <motion.h3 
                key={currentProduct.id}
                className="text-3xl md:text-4xl lg:text-5xl"
                style={{ 
                  fontFamily: "'Playfair Display', serif",
                  color: 'hsl(38, 20%, 92%)',
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                {currentProduct.title}
              </motion.h3>
            </AnimatePresence>

            {/* Description */}
            <p 
              className="text-base leading-relaxed"
              style={{ color: 'hsla(38, 20%, 75%, 0.7)' }}
            >
              فستان حرير انسيابي بتطريز ذهبي فاخر. تحفة فنية من الأناقة الشرقية تجمع بين الأصالة والمعاصرة.
            </p>

            {/* Price */}
            <div className="flex items-baseline gap-5">
              <motion.span 
                key={`price-${currentProduct.id}`}
                className="text-3xl md:text-4xl"
                style={{ color: 'hsl(38, 85%, 55%)' }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {currentProduct.price.toLocaleString()} ر.س
              </motion.span>
              {currentProduct.originalPrice && currentProduct.originalPrice > currentProduct.price && (
                <span 
                  className="text-xl line-through"
                  style={{ color: 'hsla(38, 20%, 50%, 0.5)' }}
                >
                  {currentProduct.originalPrice.toLocaleString()} ر.س
                </span>
              )}
            </div>

            {/* Add to Bag */}
            <motion.button
              onClick={() => onAddToBag?.(currentProduct)}
              className="w-full py-5 text-sm tracking-[0.25em] uppercase font-medium relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, hsl(38, 90%, 50%), hsl(43, 90%, 52%))',
                color: 'hsl(20, 15%, 8%)',
                borderRadius: '4px',
                boxShadow: '0 15px 50px hsla(38, 90%, 50%, 0.3)',
              }}
              whileHover={{ 
                scale: 1.02, 
                boxShadow: '0 25px 70px hsla(38, 90%, 50%, 0.4)' 
              }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(105deg, transparent 40%, hsla(0, 0%, 100%, 0.25) 50%, transparent 60%)',
                }}
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
              />
              <span className="relative">أضيفي إلى الحقيبة</span>
            </motion.button>

            {/* Thumbnails */}
            {products.length > 1 && (
              <div className="flex gap-4 pt-6 overflow-x-auto pb-2">
                {products.slice(0, 5).map((product, index) => (
                  <motion.button
                    key={product.id}
                    onClick={() => handleProductChange(index)}
                    className="flex-shrink-0 w-20 h-28 rounded-lg overflow-hidden relative"
                    style={{
                      border: index === currentIndex 
                        ? '2px solid hsl(38, 80%, 55%)' 
                        : '1px solid hsla(38, 30%, 30%, 0.3)',
                      boxShadow: index === currentIndex 
                        ? '0 0 20px hsla(38, 90%, 50%, 0.3)' 
                        : 'none',
                    }}
                    whileHover={{ 
                      scale: 1.08,
                      borderColor: 'hsla(38, 80%, 55%, 0.7)',
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <img 
                      src={product.imageUrl} 
                      alt={product.title}
                      className={`w-full h-full object-cover transition-all duration-300 ${
                        index === currentIndex ? '' : 'opacity-50 grayscale-[30%]'
                      }`}
                    />
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
