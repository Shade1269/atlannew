import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Minimize2, Maximize2 } from 'lucide-react';
import { UnifiedButton as Button } from '@/components/design-system';
import { Input } from '@/components/ui/input';
import { UnifiedCard as Card, UnifiedCardContent as CardContent, UnifiedCardHeader as CardHeader, UnifiedCardTitle as CardTitle } from '@/components/design-system';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useCustomerServiceChat } from '@/hooks/useCustomerServiceChat';

interface CustomerChatWidgetProps {
  storeId: string;
  storeName: string;
  customerProfileId?: string;
  isAuthenticated: boolean;
  onAuthRequired: () => void;
}

export const CustomerChatWidget: React.FC<CustomerChatWidgetProps> = ({
  storeId,
  storeName,
  customerProfileId,
  isAuthenticated,
  onAuthRequired
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    currentRoomId,
    messages,
    loading,
    initiateChatWithStore,
    sendMessage,
    startTyping,
    stopTyping
  } = useCustomerServiceChat({
    storeId,
    customerProfileId,
    isStoreOwner: false
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const handleOpen = async () => {
    if (!isAuthenticated) {
      onAuthRequired();
      return;
    }

    setIsOpen(true);
    if (!currentRoomId) {
      await initiateChatWithStore();
    }
  };

  const handleSendMessage = async () => {
    if (messageText.trim()) {
      await sendMessage(messageText.trim());
      setMessageText('');
      stopTyping();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);
    if (e.target.value.trim()) {
      startTyping();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <motion.div
        className="fixed bottom-24 left-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          onClick={handleOpen}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg bg-secondary hover:bg-secondary/90 relative"
          dir="rtl"
          title="الدردشة مع الدعم"
        >
          <MessageCircle className="h-6 w-6" />
          <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-success border-2 border-background"></div>
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="fixed bottom-24 left-6 z-50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <Card className={`w-[380px] shadow-2xl border-border/50 ${isMinimized ? 'h-auto' : 'h-[550px]'}`} dir="rtl">
        <CardHeader className="p-4 gradient-header-secondary text-secondary-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10 border-2 border-secondary-foreground/20">
                  <AvatarFallback className="bg-secondary-foreground/20 text-secondary-foreground">
                    <MessageCircle className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-success border-2 border-secondary"></div>
              </div>
              <div>
                <CardTitle className="text-base">{storeName}</CardTitle>
                <p className="text-xs opacity-90">دعم العملاء</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-secondary-foreground/20 text-secondary-foreground"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-secondary-foreground/20 text-secondary-foreground"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <CardContent className="p-0 flex flex-col h-[430px]">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {loading ? (
                      <div className="text-center text-muted-foreground text-sm py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-secondary border-t-transparent mx-auto mb-3"></div>
                        جاري التحميل...
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-muted-foreground text-sm py-12">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                          <MessageCircle className="h-8 w-8" />
                        </div>
                        <p className="font-medium mb-1">مرحباً بك!</p>
                        <p className="text-xs">كيف يمكننا مساعدتك اليوم؟</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex gap-3 ${
                            message.sender_id === customerProfileId ? 'flex-row-reverse' : 'flex-row'
                          }`}
                        >
                          {message.sender_id !== customerProfileId && (
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarImage src={message.sender?.avatar_url ?? undefined} />
                              <AvatarFallback className="text-xs bg-secondary text-secondary-foreground">
                                {message.sender?.full_name?.charAt(0) || 'م'}
                              </AvatarFallback>
                            </Avatar>
                          )}

                          <div className={`flex-1 ${
                            message.sender_id === customerProfileId ? 'text-right' : 'text-right'
                          }`}>
                            <div
                              className={`inline-block max-w-[85%] rounded-2xl px-4 py-2 ${
                                message.sender_id === customerProfileId
                                  ? 'bg-secondary text-secondary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 px-1">
                              {format(new Date(message.created_at), 'HH:mm', { locale: ar })}
                            </p>
                          </div>
                        </motion.div>
                      ))
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <div className="p-4 border-t border-border bg-muted/30">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      ref={inputRef}
                      value={messageText}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      placeholder="اكتب رسالتك..."
                      disabled={loading}
                      className="flex-1 text-right"
                      dir="rtl"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!messageText.trim() || loading}
                      className="bg-secondary hover:bg-secondary/90"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </form>
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};
