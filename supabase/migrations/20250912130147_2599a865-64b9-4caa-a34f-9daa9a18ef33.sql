-- إنشاء enum لحالات الدفع
CREATE TYPE payment_status AS ENUM (
  'PENDING',           -- في الانتظار
  'PROCESSING',        -- قيد المعالجة
  'COMPLETED',         -- مكتمل
  'FAILED',            -- فشل
  'CANCELLED',         -- ملغي
  'REFUNDED'           -- مرتجع
);

-- إنشاء enum لطرق الدفع
CREATE TYPE payment_method AS ENUM (
  'CASH_ON_DELIVERY',  -- الدفع عند الاستلام
  'CREDIT_CARD',       -- بطاقة ائتمان
  'DEBIT_CARD',        -- بطاقة مدين
  'BANK_TRANSFER',     -- تحويل بنكي
  'MADA',              -- مدى
  'APPLE_PAY',         -- آبل باي
  'STC_PAY',           -- STC Pay
  'WALLET'             -- محفظة إلكترونية
);

-- إنشاء enum لطرق الشحن
CREATE TYPE shipping_method AS ENUM (
  'STANDARD',          -- عادي
  'EXPRESS',           -- سريع
  'SAME_DAY',          -- نفس اليوم
  'PICKUP'             -- استلام من المتجر
);

-- جدول عناوين الشحن
CREATE TABLE public.shipping_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT,
  country TEXT NOT NULL DEFAULT 'SA',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول عربة التسوق
CREATE TABLE public.shopping_carts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id TEXT, -- للمستخدمين غير المسجلين
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '30 days'),
  
  -- يجب أن يكون المستخدم مسجل أو لديه session
  CONSTRAINT valid_cart_owner CHECK (
    (user_id IS NOT NULL AND session_id IS NULL) OR 
    (user_id IS NULL AND session_id IS NOT NULL)
  )
);

-- جدول عناصر عربة التسوق
CREATE TABLE public.cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cart_id UUID NOT NULL REFERENCES shopping_carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_sar DECIMAL(10,2) NOT NULL CHECK (unit_price_sar >= 0),
  total_price_sar DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price_sar) STORED,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- منع التكرار لنفس المنتج في نفس العربة
  UNIQUE(cart_id, product_id)
);

-- جدول الطلبات المحدث
CREATE TABLE public.ecommerce_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  
  -- معلومات العميل
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,
  
  -- عنوان الشحن
  shipping_address JSONB NOT NULL,
  
  -- تفاصيل الطلب
  status order_status NOT NULL DEFAULT 'PENDING',
  subtotal_sar DECIMAL(12,2) NOT NULL CHECK (subtotal_sar >= 0),
  tax_sar DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (tax_sar >= 0),
  shipping_sar DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (shipping_sar >= 0),
  discount_sar DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (discount_sar >= 0),
  total_sar DECIMAL(12,2) NOT NULL CHECK (total_sar >= 0),
  
  -- معلومات الشحن
  shipping_method shipping_method NOT NULL DEFAULT 'STANDARD',
  tracking_number TEXT,
  estimated_delivery_date DATE,
  
  -- معلومات الدفع
  payment_method payment_method NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'PENDING',
  
  -- كوبون الخصم
  coupon_code TEXT,
  coupon_discount_sar DECIMAL(10,2) DEFAULT 0,
  
  -- ملاحظات
  notes TEXT,
  internal_notes TEXT, -- ملاحظات داخلية للإدارة
  
  -- التواريخ
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE
);