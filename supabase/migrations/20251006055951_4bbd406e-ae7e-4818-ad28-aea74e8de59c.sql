-- إنشاء جدول طلبات السحب (withdrawal_requests)
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_type TEXT NOT NULL DEFAULT 'affiliate',
  amount_sar NUMERIC(10, 2) NOT NULL CHECK (amount_sar > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('bank_transfer', 'stc_pay', 'wallet')),
  
  -- معلومات الحساب البنكي
  bank_name TEXT,
  bank_account_name TEXT,
  bank_account_number TEXT,
  iban TEXT,
  
  -- معلومات المحفظة الإلكترونية
  phone_number TEXT,
  
  -- حالة الطلب
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  
  -- ملاحظات
  notes TEXT,
  admin_notes TEXT,
  
  -- التواريخ
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- إنشاء جدول إعدادات المنصة (platform_settings)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- إضافة إعداد الحد الأدنى للسحب
INSERT INTO public.platform_settings (setting_key, setting_value, description)
VALUES (
  'minimum_withdrawal_amount',
  '{"amount": 100}',
  'الحد الأدنى لمبلغ السحب بالريال السعودي'
)
ON CONFLICT (setting_key) DO NOTHING;

-- تفعيل RLS على withdrawal_requests
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- سياسة للمسوقين لعرض طلباتهم فقط
CREATE POLICY "المسوقون يمكنهم عرض طلبات السحب الخاصة بهم"
ON public.withdrawal_requests
FOR SELECT
USING (
  user_id IN (
    SELECT id FROM public.profiles 
    WHERE auth_user_id = auth.uid()
  )
);

-- سياسة للمسوقين لإنشاء طلبات سحب
CREATE POLICY "المسوقون يمكنهم إنشاء طلبات سحب"
ON public.withdrawal_requests
FOR INSERT
WITH CHECK (
  user_id IN (
    SELECT id FROM public.profiles 
    WHERE auth_user_id = auth.uid()
  )
);

-- سياسة للإداريين لعرض جميع الطلبات
CREATE POLICY "الإداريون يمكنهم عرض جميع طلبات السحب"
ON public.withdrawal_requests
FOR ALL
USING (
  get_current_user_role() = 'admin'
);

-- تفعيل RLS على platform_settings
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- سياسة للجميع لقراءة الإعدادات
CREATE POLICY "الجميع يمكنهم قراءة إعدادات المنصة"
ON public.platform_settings
FOR SELECT
USING (true);

-- سياسة للإداريين فقط لتعديل الإعدادات
CREATE POLICY "الإداريون فقط يمكنهم تعديل إعدادات المنصة"
ON public.platform_settings
FOR ALL
USING (
  get_current_user_role() = 'admin'
);

-- إنشاء دالة لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إضافة trigger لتحديث updated_at في withdrawal_requests
DROP TRIGGER IF EXISTS update_withdrawal_requests_updated_at ON public.withdrawal_requests;
CREATE TRIGGER update_withdrawal_requests_updated_at
BEFORE UPDATE ON public.withdrawal_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- إضافة trigger لتحديث updated_at في platform_settings
DROP TRIGGER IF EXISTS update_platform_settings_updated_at ON public.platform_settings;
CREATE TRIGGER update_platform_settings_updated_at
BEFORE UPDATE ON public.platform_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON public.withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON public.withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_requested_at ON public.withdrawal_requests(requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_settings_key ON public.platform_settings(setting_key);