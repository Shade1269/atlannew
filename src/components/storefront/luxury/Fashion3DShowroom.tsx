import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, useTexture, PerspectiveCamera } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

interface Fashion3DShowroomProps {
  products: Product[];
  selectedIndex?: number;
  onProductChange?: (index: number) => void;
  onAddToBag?: (product: Product) => void;
}

// Feminine Mannequin Shape with Dress Texture
const DressMannequin: React.FC<{ imageUrl: string; isActive: boolean }> = ({ imageUrl, isActive }) => {
  const meshRef = useRef<THREE.Group>(null);
  
  // Load texture
  const texture = useTexture(imageUrl, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
  });

  // Subtle auto-rotation when not being dragged
  useFrame((state) => {
    if (meshRef.current && isActive) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  // Create a dress-like geometry using LatheGeometry
  const dressShape = React.useMemo(() => {
    const points = [];
    // Create feminine silhouette from top to bottom
    for (let i = 0; i <= 50; i++) {
      const t = i / 50;
      let radius;
      
      if (t < 0.1) {
        // Neck/shoulders
        radius = 0.15 + t * 0.3;
      } else if (t < 0.3) {
        // Upper torso (bust area)
        radius = 0.45 + Math.sin((t - 0.1) * Math.PI / 0.2) * 0.15;
      } else if (t < 0.45) {
        // Waist (narrower)
        radius = 0.5 - Math.sin((t - 0.3) * Math.PI / 0.15) * 0.2;
      } else if (t < 0.6) {
        // Hips
        radius = 0.35 + Math.sin((t - 0.45) * Math.PI / 0.15) * 0.2;
      } else {
        // Dress skirt (flowing outward)
        radius = 0.55 + (t - 0.6) * 1.2;
      }
      
      points.push(new THREE.Vector2(radius, (t - 0.5) * 4));
    }
    return new THREE.LatheGeometry(points, 64);
  }, []);

  return (
    <group ref={meshRef} position={[0, 0, 0]}>
      {/* Main Dress */}
      <mesh geometry={dressShape} castShadow receiveShadow>
        <meshStandardMaterial
          map={texture}
          side={THREE.DoubleSide}
          roughness={0.8}
          metalness={0}
          envMapIntensity={0.3}
        />
      </mesh>
      
      {/* Subtle inner shadow for depth */}
      <mesh geometry={dressShape} scale={[0.98, 1, 0.98]}>
        <meshStandardMaterial
          color="#1a1510"
          side={THREE.BackSide}
          transparent
          opacity={0.3}
        />
      </mesh>
    </group>
  );
};

// Fashion Studio Lighting Setup
const StudioLighting: React.FC = () => {
  return (
    <>
      {/* Key Light - Main front illumination */}
      <spotLight
        position={[5, 8, 10]}
        angle={0.4}
        penumbra={0.8}
        intensity={2}
        color="#fff5e6"
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      
      {/* Fill Light - Left side */}
      <spotLight
        position={[-6, 4, 4]}
        angle={0.6}
        penumbra={1}
        intensity={0.8}
        color="#e6f0ff"
      />
      
      {/* Fill Light - Right side */}
      <spotLight
        position={[6, 4, 4]}
        angle={0.6}
        penumbra={1}
        intensity={0.8}
        color="#fff0e6"
      />
      
      {/* Rim Light - Back silhouette definition */}
      <spotLight
        position={[0, 6, -8]}
        angle={0.5}
        penumbra={0.5}
        intensity={1.5}
        color="#ffcc80"
      />
      
      {/* Ambient fill */}
      <ambientLight intensity={0.2} color="#2a1f15" />
    </>
  );
};

// Boutique Stage
const BoutiqueStage: React.FC = () => {
  return (
    <>
      {/* Floor with gradient */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <circleGeometry args={[8, 64]} />
        <meshStandardMaterial
          color="#1a1510"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
      
      {/* Contact shadow for realism */}
      <ContactShadows
        position={[0, -1.99, 0]}
        opacity={0.6}
        scale={10}
        blur={2}
        far={4}
        color="#0a0805"
      />
      
      {/* Ambient glow ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.98, 0]}>
        <ringGeometry args={[2.5, 3, 64]} />
        <meshBasicMaterial
          color="#c9a040"
          transparent
          opacity={0.05}
        />
      </mesh>
    </>
  );
};

// Camera Controller
const CameraController: React.FC = () => {
  const { camera } = useThree();
  
  useEffect(() => {
    camera.position.set(0, 1, 6);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  
  return null;
};

// Main 3D Scene
const Scene3D: React.FC<{ product: Product; isActive: boolean }> = ({ product, isActive }) => {
  return (
    <>
      <CameraController />
      <StudioLighting />
      <BoutiqueStage />
      
      <Suspense fallback={null}>
        <DressMannequin imageUrl={product.imageUrl} isActive={isActive} />
      </Suspense>
      
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={4}
        maxDistance={10}
        minPolarAngle={Math.PI * 0.2}
        maxPolarAngle={Math.PI * 0.7}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
      />
      
      <Environment preset="studio" background={false} />
    </>
  );
};

// Loading indicator for Canvas

// Main Component
export const Fashion3DShowroom: React.FC<Fashion3DShowroomProps> = ({
  products,
  selectedIndex = 0,
  onProductChange,
  onAddToBag,
}) => {
  const [currentIndex, setCurrentIndex] = useState(selectedIndex);
  const currentProduct = products[currentIndex];

  const handlePrev = () => {
    const newIndex = (currentIndex - 1 + products.length) % products.length;
    setCurrentIndex(newIndex);
    onProductChange?.(newIndex);
  };

  const handleNext = () => {
    const newIndex = (currentIndex + 1) % products.length;
    setCurrentIndex(newIndex);
    onProductChange?.(newIndex);
  };

  if (!products.length || !currentProduct) {
    return null;
  }

  return (
    <section 
      id="showroom"
      className="min-h-screen py-20 relative"
      style={{
        background: `
          radial-gradient(ellipse 100% 60% at 50% 40%, hsla(30, 30%, 12%, 0.8) 0%, transparent 50%),
          linear-gradient(180deg, hsl(20, 12%, 6%) 0%, hsl(20, 12%, 8%) 50%, hsl(20, 12%, 6%) 100%)
        `,
      }}
    >
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p 
            className="text-xs tracking-[0.4em] uppercase mb-4"
            style={{ color: 'hsl(38, 80%, 55%)' }}
          >
            تجربة غامرة
          </p>
          <h2 
            className="text-3xl md:text-4xl"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            صالة العرض 360°
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* 3D Canvas */}
          <motion.div 
            className="relative aspect-[3/4] lg:aspect-square rounded-lg overflow-hidden"
            style={{
              background: 'radial-gradient(ellipse at center, hsla(30, 20%, 12%, 1) 0%, hsla(20, 12%, 8%, 1) 100%)',
              boxShadow: '0 40px 80px hsla(0, 0%, 0%, 0.5)',
            }}
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Canvas shadows dpr={[1, 2]}>
              <PerspectiveCamera makeDefault position={[0, 1, 6]} fov={45} />
              <Scene3D product={currentProduct} isActive={true} />
            </Canvas>

            {/* Drag hint */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs opacity-40 tracking-widest uppercase">
              اسحبي للدوران • مرري للتكبير
            </div>

            {/* Navigation Arrows */}
            {products.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all hover:scale-110"
                  style={{ 
                    background: 'hsla(20, 12%, 10%, 0.8)',
                    border: '1px solid hsla(38, 30%, 50%, 0.2)',
                  }}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all hover:scale-110"
                  style={{ 
                    background: 'hsla(20, 12%, 10%, 0.8)',
                    border: '1px solid hsla(38, 30%, 50%, 0.2)',
                  }}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Category & Badges */}
            <div className="flex items-center gap-3">
              <span 
                className="text-xs tracking-[0.3em] uppercase opacity-60"
              >
                {currentProduct.category || 'أزياء السهرة'}
              </span>
              {currentProduct.isNew && (
                <span 
                  className="px-2 py-1 text-[10px] tracking-widest uppercase"
                  style={{ 
                    background: 'hsl(38, 90%, 50%)',
                    color: 'hsl(20, 12%, 5%)',
                  }}
                >
                  جديد
                </span>
              )}
              {currentProduct.isSale && (
                <span 
                  className="px-2 py-1 text-[10px] tracking-widest uppercase"
                  style={{ 
                    background: 'hsl(345, 60%, 40%)',
                    color: 'white',
                  }}
                >
                  تخفيض
                </span>
              )}
            </div>

            {/* Title */}
            <h3 
              className="text-2xl md:text-3xl lg:text-4xl"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {currentProduct.title}
            </h3>

            {/* Description placeholder */}
            <p className="opacity-60 leading-relaxed">
              فستان حرير انسيابي بتطريز ذهبي رائع. تحفة فنية من الأناقة الشرقية.
            </p>

            {/* Price */}
            <div className="flex items-baseline gap-4">
              <span 
                className="text-2xl md:text-3xl"
                style={{ color: 'hsl(38, 80%, 55%)' }}
              >
                {currentProduct.price.toLocaleString()} ر.س
              </span>
              {currentProduct.originalPrice && currentProduct.originalPrice > currentProduct.price && (
                <span className="text-lg line-through opacity-40">
                  {currentProduct.originalPrice.toLocaleString()} ر.س
                </span>
              )}
            </div>

            {/* Add to Bag Button */}
            <motion.button
              onClick={() => onAddToBag?.(currentProduct)}
              className="w-full py-4 text-sm tracking-[0.2em] uppercase font-medium mt-8"
              style={{
                background: 'linear-gradient(135deg, hsl(38, 90%, 50%), hsl(43, 85%, 55%))',
                color: 'hsl(20, 12%, 5%)',
                borderRadius: '2px',
              }}
              whileHover={{ scale: 1.02, boxShadow: '0 10px 40px hsla(38, 90%, 50%, 0.3)' }}
              whileTap={{ scale: 0.98 }}
            >
              أضيفي إلى الحقيبة
            </motion.button>

            {/* Thumbnail Navigation */}
            {products.length > 1 && (
              <div className="flex gap-3 pt-6 overflow-x-auto pb-2">
                {products.slice(0, 4).map((product, index) => (
                  <motion.button
                    key={product.id}
                    onClick={() => {
                      setCurrentIndex(index);
                      onProductChange?.(index);
                    }}
                    className={`flex-shrink-0 w-20 h-28 rounded overflow-hidden transition-all ${
                      index === currentIndex ? 'ring-2 ring-amber-500' : 'opacity-50'
                    }`}
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
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
