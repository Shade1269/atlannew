import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UnifiedButton } from '@/components/design-system';
import { Input } from '@/components/ui/input';
import { UnifiedCard } from '@/components/design-system';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ModernAIChatWidgetProps {
  storeInfo: {
    id: string;
    store_name: string;
    bio?: string | null | undefined;
  };
  products?: Array<{
    id: string;
    title: string;
    description: string;
    price_sar: number;
    stock: number;
    category: string;
  }>;
}

export const ModernAIChatWidget = ({ storeInfo, products }: ModernAIChatWidgetProps) => {
  // Always open - managed by parent DraggableChatButton
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `مرحباً! أنا المساعد الذكي لمتجر ${storeInfo.store_name}. كيف يمكنني مساعدتك اليوم؟ 🛍️`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const CHAT_URL = 'https://uewuiiopkctdtaexmtxu.supabase.co/functions/v1/ai-chat';
      
      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVld3VpaW9wa2N0ZHRhZXhtdHh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMjE2ODUsImV4cCI6MjA3MTg5NzY4NX0._q03bmVxGQhCczoBaOHM6mIGbA7_B4B7PZ5mhDefuFA',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          storeInfo,
          products: products?.slice(0, 20) // Send first 20 products to AI
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل الاتصال بالخادم');
      }

      if (!response.body) {
        throw new Error('لم يتم استلام رد من الخادم');
      }

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let textBuffer = '';

      // Add initial assistant message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            
            if (content) {
              assistantContent += content;
              
              // Update the last message with accumulated content
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage.role === 'assistant') {
                  lastMessage.content = assistantContent;
                }
                return newMessages;
              });
            }
          } catch (e) {
            // Incomplete JSON, put it back
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw || raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage.role === 'assistant') {
                  lastMessage.content = assistantContent;
                }
                return newMessages;
              });
            }
          } catch {
            // Ignore JSON parsing errors for incomplete streaming data
          }
        }
      }

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'حدث خطأ أثناء إرسال الرسالة');
      
      // Remove the empty assistant message if error occurred
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.role === 'assistant' && !lastMessage.content) {
          newMessages.pop();
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[420px]">
      {/* Chat Window - always visible when rendered */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
            <UnifiedCard className="flex flex-col h-[600px] shadow-2xl border-border/50 overflow-hidden">
              {/* Header */}
              <div className="gradient-btn-primary text-primary-foreground p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center backdrop-blur-sm">
                      <Bot className="h-6 w-6" />
                    </div>
                    <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-success border-2 border-primary"></div>
                  </div>
                  <div>
                    <h3 className="font-bold">مساعد {storeInfo.store_name}</h3>
                    <p className="text-xs opacity-90">متصل الآن</p>
                  </div>
                </div>
                {/* Close button removed - managed by parent */}
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex gap-3 ${
                        message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        {message.role === 'user' ? (
                          <UserIcon className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className={`flex-1 ${
                        message.role === 'user' ? 'text-right' : 'text-right'
                      }`}>
                        <div className={`inline-block rounded-2xl px-4 py-2 max-w-[85%] ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 px-1">
                          {message.timestamp.toLocaleTimeString('ar-SA', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-3"
                    >
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div className="bg-muted rounded-2xl px-4 py-3">
                        <div className="flex gap-1">
                          <div className="h-2 w-2 rounded-full bg-primary/50 animate-bounce"></div>
                          <div className="h-2 w-2 rounded-full bg-primary/50 animate-bounce [animation-delay:0.2s]"></div>
                          <div className="h-2 w-2 rounded-full bg-primary/50 animate-bounce [animation-delay:0.4s]"></div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t border-border bg-muted/30">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="flex gap-2"
                >
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="اكتب سؤالك هنا..."
                    disabled={isLoading}
                    className="flex-1 text-right"
                    dir="rtl"
                  />
                  <UnifiedButton
                    type="submit"
                    size="icon"
                    disabled={!input.trim() || isLoading}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Send className="h-5 w-5" />
                  </UnifiedButton>
                </form>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  مدعوم بتقنية Lovable AI ✨
                </p>
              </div>
            </UnifiedCard>
          </motion.div>
    </div>
  );
};
