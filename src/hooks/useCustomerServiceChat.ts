import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  created_at: string;
  sender?: {
    id: string;
    full_name: string | null;
    avatar_url?: string | null;
  };
}

interface ChatRoom {
  id: string;
  name: string;
  type: string;
  description?: string | null;
  owner_id?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  max_members?: number | null;
}

interface UseCustomerServiceChatProps {
  storeId: string;
  customerProfileId?: string;
  isStoreOwner?: boolean;
}

export const useCustomerServiceChat = ({
  storeId,
  customerProfileId,
  isStoreOwner = false
}: UseCustomerServiceChatProps) => {
  const { toast } = useToast();
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const channelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const initiateChatWithStore = async () => {
    if (!customerProfileId) {
      toast({
        title: 'تسجيل الدخول مطلوب',
        description: 'يجب تسجيل الدخول لبدء المحادثة',
        variant: 'destructive'
      });
      return null;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_or_create_customer_service_chat', {
        p_store_id: storeId,
        p_customer_profile_id: customerProfileId
      });

      if (error) throw error;

      setCurrentRoomId(data as string);
      await loadMessages(data as string);
      setupRealtimeSubscription(data as string);

      return data;
    } catch (error: any) {
      console.error('Error initiating chat:', error);
      toast({
        title: 'خطأ في بدء المحادثة',
        description: error.message,
        variant: 'destructive'
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:profiles!chat_messages_sender_id_fkey(id, full_name, avatar_url)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadStoreChats = async () => {
    if (!isStoreOwner) return;

    try {
      // Get store owner profile id first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!profile) return;

      // Get customer_service rooms where the store owner is a member
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          room_members!inner(user_id, role)
        `)
        .eq('type', 'customer_service')
        .eq('is_active', true)
        .eq('room_members.user_id', profile.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error loading store chats:', error);
    }
  };

  const setupRealtimeSubscription = (roomId: string) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    channelRef.current = supabase
      .channel(`chat-room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        async (payload) => {
          const newMessage = payload.new as ChatMessage;

          const { data: senderData } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', newMessage.sender_id)
            .single();

          if (senderData) {
            newMessage.sender = senderData;
          }

          setMessages((prev) => {
            if (prev.some(m => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();
  };

  const sendMessage = async (content: string) => {
    if (!currentRoomId || !content.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      const { error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: currentRoomId,
          sender_id: profile.id,
          content: content.trim(),
          message_type: 'text'
        });

      if (error) throw error;

      stopTyping();
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: 'خطأ في إرسال الرسالة',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const startTyping = () => {
    if (!currentRoomId || isTyping) return;

    setIsTyping(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  };

  const stopTyping = () => {
    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isStoreOwner) {
      loadStoreChats();
    }
  }, [isStoreOwner, storeId]);

  return {
    currentRoomId,
    messages,
    rooms,
    loading,
    isTyping,
    initiateChatWithStore,
    loadMessages,
    loadStoreChats,
    sendMessage,
    startTyping,
    stopTyping,
    setCurrentRoomId
  };
};
