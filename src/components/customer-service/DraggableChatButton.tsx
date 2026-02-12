import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Bot, Headphones, X } from 'lucide-react';
import { UnifiedButton as Button } from '@/components/design-system';
import { UnifiedCard as Card, UnifiedCardContent as CardContent, UnifiedCardHeader as CardHeader, UnifiedCardTitle as CardTitle } from '@/components/design-system';
import { ModernAIChatWidget } from '@/components/storefront/modern/ModernAIChatWidget';
import { CustomerChatWidget } from '@/components/customer-service/CustomerChatWidget';

interface DraggableChatButtonProps {
  storeInfo: {
    id: string;
    store_name: string;
    bio?: string | null | undefined;
  };
  products: Array<{
    id: string;
    title: string;
    description: string;
    price_sar: number;
    stock: number;
    category: string;
  }>;
  customerProfileId?: string;
  isAuthenticated: boolean;
  onAuthRequired: () => void;
}

type ChatMode = 'closed' | 'menu' | 'ai' | 'human';

export const DraggableChatButton: React.FC<DraggableChatButtonProps> = ({
  storeInfo,
  products,
  customerProfileId,
  isAuthenticated,
  onAuthRequired
}) => {
  const [mode, setMode] = useState<ChatMode>('closed');
  const [position, setPosition] = useState({ x: 16, y: window.innerHeight - 140 });
  const [isDragging, setIsDragging] = useState(false);
  
  const dragStartPos = useRef({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);

  // Load saved position from localStorage
  useEffect(() => {
    const savedPos = localStorage.getItem('chat-button-position');
    if (savedPos) {
      try {
        const parsed = JSON.parse(savedPos);
        // Validate position is within viewport
        const maxX = window.innerWidth - 60;
        const maxY = window.innerHeight - 140;
        setPosition({
          x: Math.min(Math.max(16, parsed.x), maxX),
          y: Math.min(Math.max(16, parsed.y), maxY)
        });
      } catch (e) {
        console.error('Failed to parse saved position');
      }
    }
  }, []);

  // Save position to localStorage
  const savePosition = (x: number, y: number) => {
    localStorage.setItem('chat-button-position', JSON.stringify({ x, y }));
  };

  const handleDragStart = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleDrag = (e: React.PointerEvent) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragStartPos.current.x;
    const newY = e.clientY - dragStartPos.current.y;
    
    // Keep within viewport bounds
    const maxX = window.innerWidth - 60;
    const maxY = window.innerHeight - 140;
    
    const boundedX = Math.min(Math.max(16, newX), maxX);
    const boundedY = Math.min(Math.max(16, newY), maxY);
    
    setPosition({ x: boundedX, y: boundedY });
  };

  const handleDragEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      savePosition(position.x, position.y);
    }
  };

  const handleClick = () => {
    if (!isDragging) {
      setMode('menu');
    }
  };

  const handleSelectAI = () => {
    setMode('ai');
  };

  const handleSelectHuman = () => {
    if (!isAuthenticated) {
      onAuthRequired();
      setMode('closed');
      return;
    }
    setMode('human');
  };

  const handleClose = () => {
    setMode('closed');
  };

  const handleBackToMenu = () => {
    setMode('menu');
  };

  // Calculate chat window position based on button position
  const getChatWindowPosition = () => {
    const isOnRight = position.x > window.innerWidth / 2;
    const isOnBottom = position.y > window.innerHeight / 2;
    
    return {
      left: isOnRight ? 'auto' : `${position.x}px`,
      right: isOnRight ? `${window.innerWidth - position.x - 56}px` : 'auto',
      bottom: isOnBottom ? `${window.innerHeight - position.y + 60}px` : 'auto',
      top: isOnBottom ? 'auto' : `${position.y + 60}px`,
    };
  };

  // Render AI Chat Widget
  if (mode === 'ai') {
    return (
      <div className="relative">
        <Button
          onClick={handleBackToMenu}
          size="sm"
          variant="ghost"
          className="fixed bottom-[590px] left-6 z-[60] bg-background/95 backdrop-blur-sm shadow-md hover:bg-background"
        >
          <X className="h-4 w-4 ml-2" />
          رجوع
        </Button>
        <ModernAIChatWidget
          storeInfo={storeInfo}
          products={products}
        />
      </div>
    );
  }

  // Render Human Support Chat Widget
  if (mode === 'human') {
    return (
      <div className="relative">
        <Button
          onClick={handleBackToMenu}
          size="sm"
          variant="ghost"
          className="fixed bottom-[590px] left-6 z-[60] bg-background/95 backdrop-blur-sm shadow-md hover:bg-background"
        >
          <X className="h-4 w-4 ml-2" />
          رجوع
        </Button>
        <CustomerChatWidget
          storeId={storeInfo.id}
          storeName={storeInfo.store_name}
          customerProfileId={customerProfileId}
          isAuthenticated={isAuthenticated}
          onAuthRequired={onAuthRequired}
        />
      </div>
    );
  }

  // Render Draggable Closed Button
  if (mode === 'closed') {
    return (
      <motion.div
        ref={buttonRef}
        className="fixed z-50 touch-none"
        style={{
          left: position.x,
          top: position.y,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: isDragging ? 1 : 1.05 }}
        whileTap={{ scale: 0.95 }}
        onPointerDown={handleDragStart}
        onPointerMove={handleDrag}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragEnd}
        onPointerLeave={handleDragEnd}
      >
        <Button
          onClick={handleClick}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground relative pointer-events-auto"
          dir="rtl"
          title="الدردشة - اسحب لتحريك الزر"
        >
          <MessageCircle className="h-6 w-6" />
          <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-success border-2 border-background"></div>
        </Button>
      </motion.div>
    );
  }

  // Render Menu
  const chatWindowPos = getChatWindowPosition();
  
  return (
    <AnimatePresence>
      <motion.div
        className="fixed z-50"
        style={chatWindowPos}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <Card className="w-[320px] shadow-2xl border-border/50" dir="rtl">
          <CardHeader className="p-4 gradient-header-secondary text-secondary-foreground">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">
                اختر نوع المحادثة
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-8 w-8 p-0 hover:bg-secondary-foreground/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {/* AI Bot Option */}
            <motion.button
              onClick={handleSelectAI}
              className="w-full p-4 rounded-lg border-2 border-border hover:border-secondary transition-all bg-card hover:bg-secondary/5 text-right group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
                  <Bot className="h-5 w-5 text-secondary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">
                    المساعد الذكي 🤖
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    احصل على إجابات فورية عن المنتجات والأسعار والعروض
                  </p>
                </div>
              </div>
            </motion.button>

            {/* Human Support Option */}
            <motion.button
              onClick={handleSelectHuman}
              className="w-full p-4 rounded-lg border-2 border-border hover:border-secondary transition-all bg-card hover:bg-secondary/5 text-right group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
                  <Headphones className="h-5 w-5 text-secondary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">
                    خدمة العملاء 👤
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    تحدث مع فريق الدعم للاستفسارات المعقدة والمساعدة الشخصية
                  </p>
                </div>
              </div>
            </motion.button>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};
