-- إكمال الجداول المتبقية مع إصلاح مشكلة العمود المُوّلد
CREATE TABLE public.ecommerce_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES ecommerce_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- بيانات المنتج وقت الطلب (snapshot)
  product_title TEXT NOT NULL,
  product_sku TEXT,
  product_image_url TEXT,
  
  -- الكميات والأسعار
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_sar DECIMAL(10,2) NOT NULL CHECK (unit_price_sar >= 0),
  total_price_sar DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price_sar) STORED,
  
  -- معلومات العمولة للمسوقين
  commission_rate DECIMAL(5,2) DEFAULT 0,
  commission_sar DECIMAL(10,2) DEFAULT 0, -- سنحسبها بتريغر
  
  -- تاريخ الإضافة
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول تاريخ حالات الطلبات
CREATE TABLE public.order_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES ecommerce_orders(id) ON DELETE CASCADE,
  old_status order_status,
  new_status order_status NOT NULL,
  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  change_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول معاملات الدفع المحدث
CREATE TABLE public.ecommerce_payment_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES ecommerce_orders(id) ON DELETE CASCADE,
  
  -- معرف المعاملة
  transaction_id TEXT UNIQUE NOT NULL,
  external_transaction_id TEXT, -- معرف البوابة الخارجية
  
  -- تفاصيل المعاملة
  amount_sar DECIMAL(12,2) NOT NULL CHECK (amount_sar >= 0),
  currency TEXT NOT NULL DEFAULT 'SAR',
  payment_method payment_method NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'PENDING',
  
  -- بوابة الدفع
  gateway_name TEXT, -- اسم بوابة الدفع
  gateway_response JSONB, -- استجابة البوابة
  gateway_fee_sar DECIMAL(10,2) DEFAULT 0,
  
  -- تواريخ مهمة
  initiated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  
  -- معلومات إضافية
  failure_reason TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول تقييمات المنتجات
CREATE TABLE public.product_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES ecommerce_orders(id) ON DELETE CASCADE,
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  
  -- صور التقييم
  images JSONB DEFAULT '[]',
  
  -- حالة التقييم
  is_approved BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  
  -- تفاعل المتجر
  store_response TEXT,
  store_response_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- منع التقييم المتعدد لنفس المنتج من نفس المستخدم
  UNIQUE(product_id, user_id)
);

-- جدول قائمة الأمنيات
CREATE TABLE public.wishlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- منع التكرار
  UNIQUE(user_id, product_id)
);

-- جدول استخدام الكوبونات المحدث
CREATE TABLE public.ecommerce_coupon_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES ecommerce_orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  discount_applied_sar DECIMAL(10,2) NOT NULL CHECK (discount_applied_sar >= 0),
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- منع استخدام نفس الكوبون أكثر من مرة في نفس الطلب
  UNIQUE(coupon_id, order_id)
);