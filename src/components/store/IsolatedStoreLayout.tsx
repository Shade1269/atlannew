import React, { useEffect, useState, useMemo, useCallback, startTransition } from 'react';
import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabasePublic } from '@/integrations/supabase/publicClient';
import { Loader2, Package, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StoreThemeProvider } from '@/components/store/ThemeProvider';
import { CustomerAuthProvider } from '@/contexts/CustomerAuthContext';
import { StorefrontProvider } from '@/contexts/StoreContext';
import { StoreProductModalProvider } from '@/contexts/StoreProductModalContext';
import { LuxuryThemeProvider, themeColors, type ThemeMode } from '@/components/storefront/luxury/LuxuryThemeContext';
import { buildLuxuryPaletteFromStoreTheme } from '@/lib/storeThemePalette';

interface StoreData {
  id: string;
  store_name: string;
  store_slug: string;
  bio?: string | null;
  logo_url?: string | null;
  theme: string;
}

// قائمة المسارات المحجوزة التي لا يجب أن تُعتبر متاجر
const RESERVED_PATHS = [
  'tracking',
  'checkout',
  'order',
  'payment',
  'auth',
  'admin',
  'affiliate',
  'merchant',
  'api',
  'track',
];

export const IsolatedStoreLayout: React.FC = () => {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const navigate = useNavigate();
  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const loadStore = async () => {
    if (!storeSlug) {
      setError('رابط المتجر غير صحيح');
      setLoading(false);
      return;
    }

    // التحقق من أن storeSlug ليس مساراً محجوزاً
    if (RESERVED_PATHS.includes(storeSlug.toLowerCase())) {
      setError('هذا المسار محجوز ولا يمكن استخدامه كمتجر');
      setLoading(false);
      navigate('/');
      return;
    }

    try {
      const { data: storeData, error: storeError } = await supabasePublic
        .from('affiliate_stores')
        .select('id, store_name, store_slug, bio, logo_url, theme')
        .eq('store_slug', storeSlug)
        .eq('is_active', true)
        .maybeSingle(); // استخدام maybeSingle بدلاً من single للتعامل مع الحالات التي لا يوجد فيها صف

      if (storeError) {
        // معالجة الخطأ 406 وأخطاء الصلاحيات بشكل خاص
        if (storeError.code === 'PGRST116' || 
            storeError.code === 'PGRST301' ||
            storeError.message?.includes('406') ||
            (storeError as any).status === 406 ||
            storeError.message?.includes('permission') ||
            storeError.message?.includes('row-level security') ||
            storeError.message?.includes('RLS')) {
          console.warn('خطأ في الصلاحيات أو RLS policies:', storeError);
          setError('المتجر غير متاح حالياً - مشكلة في الصلاحيات');
        } else {
          console.error('خطأ في جلب المتجر:', storeError);
          setError('المتجر غير موجود أو غير متاح');
        }
        setLoading(false);
        return;
      }

      if (!storeData) {
        setError('المتجر غير موجود أو غير متاح');
        setLoading(false);
        return;
      }

      setStore(storeData);
    } catch (err: any) {
      console.error('Error loading store:', err);
      // معالجة الخطأ 406 في catch
      if (err?.code === 'PGRST116' || 
          err?.message?.includes('406') ||
          err?.status === 406 ||
          err?.message?.includes('permission')) {
        setError('المتجر غير متاح حالياً - مشكلة في الصلاحيات');
      } else {
        setError('خطأ في تحميل المتجر');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStore();
  }, [storeSlug]);

  // إعادة جلب بيانات المتجر عند العودة للتبويب (لظهور التحديثات من تطبيق المسوق)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && storeSlug) loadStore();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [storeSlug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#ffffff' }} dir="rtl">
        <div className="text-center max-w-sm mx-auto px-6">
          {/* حلقة تحميل متحركة مزدوجة */}
          <div className="relative mx-auto mb-8 h-20 w-20">
            <div className="absolute inset-0 rounded-full" style={{ border: '3px solid #f3f4f6' }} />
            <div className="absolute inset-0 rounded-full animate-spin" style={{ border: '3px solid transparent', borderTopColor: '#374151', animationDuration: '0.8s' }} />
            <div className="absolute inset-2 rounded-full" style={{ border: '3px solid #f9fafb' }} />
            <div className="absolute inset-2 rounded-full animate-spin" style={{ border: '3px solid transparent', borderBottomColor: '#9ca3af', animationDirection: 'reverse', animationDuration: '1.2s' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Package className="h-6 w-6 animate-pulse" style={{ color: '#374151' }} />
            </div>
          </div>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#111827' }}>جاري تحضير المتجر</h2>
          <p className="text-sm leading-relaxed" style={{ color: '#6b7280' }}>نجهز لك تجربة تسوق مميزة... لحظات وسنكون جاهزين</p>
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#ffffff' }} dir="rtl">
        <div className="text-center max-w-sm mx-auto px-6">
          <div className="mx-auto mb-6 h-20 w-20 rounded-full flex items-center justify-center" style={{ background: '#f3f4f6' }}>
            <Package className="h-10 w-10" style={{ color: '#9ca3af' }} />
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: '#111827' }}>المتجر غير متاح</h2>
          <p className="text-sm mb-6" style={{ color: '#6b7280' }}>{error}</p>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="h-4 w-4 ml-2" />
            العودة للرئيسية
          </Button>
        </div>
      </div>
    );
  }

  return (
    <StorefrontProvider>
      <CustomerAuthProvider>
        <StoreThemeProvider storeId={store.id}>
          <StoreLayoutWithTheme store={store} storeSlug={storeSlug || ''}>
            <Outlet context={{ store }} />
          </StoreLayoutWithTheme>
        </StoreThemeProvider>
      </CustomerAuthProvider>
    </StorefrontProvider>
  );
};

const themeStorageKey = (slug: string) => `storefront-theme-${slug}`;

function StoreLayoutWithTheme({
  store,
  storeSlug,
  children,
}: {
  store: StoreData;
  storeSlug: string;
  children: React.ReactNode;
}) {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(themeStorageKey(storeSlug));
      if (saved === 'dark' || saved === 'light') return saved;
    }
    return 'light';
  });

  const { data: storeThemeConfig } = useQuery({
    queryKey: ['store-theme-config', store.id],
    queryFn: async () => {
      const { data, error } = await (supabasePublic as any).rpc('get_store_theme_config', {
        p_store_id: store.id,
      });
      if (error) return null;
      const raw = data as any;
      return raw?.theme_config ?? raw ?? null;
    },
    enabled: !!store.id,
    refetchInterval: 30_000, // تحديث الثيم كل 30 ثانية لالتقاط التغييرات من تطبيق الإعدادات
    refetchOnWindowFocus: true,
  });

  const storePalette = useMemo(
    () => (storeThemeConfig ? buildLuxuryPaletteFromStoreTheme(storeThemeConfig, themeMode) : null),
    [storeThemeConfig, themeMode]
  );

  const onModeChange = useCallback((mode: ThemeMode) => {
    startTransition(() => {
      setThemeMode(mode);
      if (typeof window !== 'undefined') localStorage.setItem(themeStorageKey(storeSlug), mode);
    });
  }, [storeSlug]);

  return (
    <LuxuryThemeProvider
      controlledMode={themeMode}
      onModeChange={onModeChange}
      overrideColors={storePalette ?? undefined}
    >
      <StoreProductModalProvider storeId={store.id} storeSlug={storeSlug}>
        {children}
      </StoreProductModalProvider>
    </LuxuryThemeProvider>
  );
}