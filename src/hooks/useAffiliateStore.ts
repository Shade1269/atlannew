import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';

interface AffiliateStore {
  id: string;
  profile_id: string;
  store_name: string;
  store_slug: string;
  bio: string;
  logo_url: string;
  theme: 'classic' | 'feminine' | 'damascus' | 'modern' | 'elegant' | 'gold' | 'alliance_special' | 'legendary';
  is_active: boolean;
  total_sales: number;
  total_orders: number;
  created_at: string;  
  updated_at: string;
}

interface CreateStoreData {
  store_name: string;
  bio?: string;
  store_slug?: string;
}

export const useAffiliateStore = () => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: store, isLoading, error } = useQuery({
    queryKey: ['affiliate-store', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (profileError) throw profileError;

      const { data, error } = await supabase
        .from('affiliate_stores')
        .select('*')
        .eq('profile_id', profile.id)
        .single();

      // معالجة أخطاء الصلاحيات و 406 بشكل خاص
      if (error) {
        if (error.code === 'PGRST116' || error.code === '42P01') {
          // جدول غير موجود أو لا توجد صفوف
          return null;
        }
        if (error.code === 'PGRST301' || 
            error.message?.includes('406') ||
            error.message?.includes('permission') ||
            error.message?.includes('row-level security') ||
            error.message?.includes('RLS')) {
          // خطأ في الصلاحيات - لا نرمي الخطأ، نعيد null
          console.warn('خطأ في الصلاحيات عند جلب المتجر:', error);
          return null;
        }
        throw error;
      }
      return data as AffiliateStore | null;
    },
    enabled: !!user
  });

  const createStoreMutation = useMutation({
    mutationFn: async (data: CreateStoreData) => {
      const { data: result, error } = await supabase.rpc('create_affiliate_store', {
        p_store_name: data.store_name,
        p_bio: data.bio ?? undefined,
        p_store_slug: data.store_slug ?? undefined
      });

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-store'] });
      toast({
        title: "تم إنشاء المتجر",
        description: "تم إنشاء متجرك بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إنشاء المتجر",
        description: error.message || "حدث خطأ أثناء إنشاء المتجر",
        variant: "destructive",
      });
    }
  });

  const updateStoreMutation = useMutation({
    mutationFn: async ({ storeId, updates }: { storeId: string; updates: Partial<AffiliateStore> }) => {
      const { error } = await supabase
        .from('affiliate_stores')
        .update(updates)
        .eq('id', storeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['affiliate-store'] });
      toast({
        title: "تم التحديث",
        description: "تم تحديث معلومات المتجر بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في التحديث", 
        description: error.message || "حدث خطأ أثناء تحديث المتجر",
        variant: "destructive",
      });
    }
  });

  return {
    store,
    isLoading,
    error,
    createStore: createStoreMutation.mutate,
    updateStore: updateStoreMutation.mutate,
    isCreating: createStoreMutation.isPending,
    isUpdating: updateStoreMutation.isPending,
  };
};