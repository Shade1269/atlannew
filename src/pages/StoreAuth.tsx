import { useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Card,
  CardContent,
  Button
} from '@/components/ui/index';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Store, ArrowRight, Loader2, Home } from "lucide-react";
import { CustomerAuth } from '@/components/auth/CustomerAuth';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';
import { useFastAuth } from '@/hooks/useFastAuth';
// Removed unused imports

interface AffiliateStore {
  id: string;
  store_name: string;
  store_slug: string;
  bio?: string;
  logo_url?: string;
  profile_id: string;
  profiles?: {
    full_name: string;
  };
}

const StoreAuth: React.FC = () => {
  const { storeSlug: slug } = useParams<{ storeSlug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || `/${slug}/orders`;
  
  const { isAuthenticated, checkStoredSession } = useCustomerAuth();
  const { profile } = useFastAuth();

  const goToUserHome = () => {
    if (profile?.role === 'admin') navigate('/admin/dashboard');
    else if (profile?.role === 'affiliate') navigate('/affiliate');
    else if (profile?.role === 'merchant') navigate('/merchant');
    else navigate('/');
  };

  // التحقق من الجلسة المحفوظة عند تحميل الصفحة
  useEffect(() => {
    checkStoredSession();
  }, [checkStoredSession]);

  // إعادة التوجيه إذا كان العميل مسجل دخول بالفعل
  useEffect(() => {
    if (isAuthenticated) {
      // فك تشفير URL إذا كان مشفراً
      const decodedUrl = decodeURIComponent(returnUrl);
      navigate(decodedUrl, { replace: true });
    }
  }, [isAuthenticated, navigate, returnUrl]);

  // جلب بيانات المتجر
  const { data: store, isLoading: storeLoading, error: storeError } = useQuery({
    queryKey: ['affiliate-store', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('affiliate_stores')
        .select(`
          id,
          store_name,
          store_slug,
          bio,
          logo_url,
          profile_id,
          profiles!affiliate_stores_profile_id_fkey (
            full_name
          )
        `)
        .eq('store_slug', slug ?? '')
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as AffiliateStore;
    },
    enabled: !!slug
  });

  // معالجة نجاح تسجيل الدخول
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleAuthSuccess = (_customer: unknown) => {
    // فك تشفير URL وإزالة البادئة إذا كانت موجودة
    const decodedUrl = decodeURIComponent(returnUrl).replace(/^\//, '');
    const finalUrl = decodedUrl.startsWith('store/') ? `/${decodedUrl}` : returnUrl;
    // التوجيه الفوري بعد النجاح
    navigate(finalUrl, { replace: true });
  };

  // العودة للمتجر
  const handleBackToStore = () => {
    navigate(`/${slug}`, { replace: true });
  };

  if (storeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (storeError || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-6">
            <Store className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-xl font-bold mb-2">المتجر غير موجود</h1>
            <p className="text-muted-foreground mb-4">
              لم يتم العثور على المتجر المطلوب أو أنه غير متاح حالياً
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              العودة للرئيسية
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg-secondary">
      {/* رأس الصفحة مع معلومات المتجر */}
      <div className="bg-card/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={store.logo_url || ''} alt={store.store_name} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {store.store_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h1 className="text-xl font-bold">{store.store_name}</h1>
                <p className="text-sm text-muted-foreground">
                  {store.profiles?.full_name && `بواسطة ${store.profiles.full_name}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={goToUserHome}
                className="flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                الرئيسية
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleBackToStore}
                className="flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                العودة للمتجر
              </Button>
            </div>
          </div>
          
          {store.bio && (
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              {store.bio}
            </p>
          )}
        </div>
      </div>

      {/* نموذج تسجيل الدخول */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <CustomerAuth
            storeId={store.id}
            storeName={store.store_name}
            onSuccess={handleAuthSuccess}
            onCancel={handleBackToStore}
          />
          
          {/* روابط الشروط والأحكام */}
          <div className="mt-8 text-center text-xs text-muted-foreground space-y-2">
            <p>
              بتسجيل الدخول، أنت توافق على{' '}
              <button className="text-primary hover:underline">
                الشروط والأحكام
              </button>
              {' '}و{' '}
              <button className="text-primary hover:underline">
                سياسة الخصوصية
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreAuth;