-- إنشاء enum لحالات الطلبات
CREATE TYPE order_status AS ENUM (
  'PENDING',           -- في الانتظار
  'CONFIRMED',         -- مؤكد
  'PROCESSING',        -- قيد التجهيز
  'SHIPPED',           -- تم الشحن
  'DELIVERED',         -- تم التسليم
  'CANCELLED',         -- ملغي
  'REFUNDED'           -- مرتجع
);

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

-- جدول عناصر الطلبات المحدث
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
  commission_sar DECIMAL(10,2) GENERATED ALWAYS AS (total_price_sar * commission_rate / 100) STORED,
  
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

-- إنشاء الفهارس لتحسين الأداء
CREATE INDEX idx_shipping_addresses_user_id ON public.shipping_addresses(user_id);
CREATE INDEX idx_shipping_addresses_default ON public.shipping_addresses(user_id, is_default) WHERE is_default = true;

CREATE INDEX idx_shopping_carts_user_id ON public.shopping_carts(user_id);
CREATE INDEX idx_shopping_carts_session_id ON public.shopping_carts(session_id);
CREATE INDEX idx_shopping_carts_expires_at ON public.shopping_carts(expires_at);

CREATE INDEX idx_cart_items_cart_id ON public.cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON public.cart_items(product_id);

CREATE INDEX idx_ecommerce_orders_user_id ON public.ecommerce_orders(user_id);
CREATE INDEX idx_ecommerce_orders_shop_id ON public.ecommerce_orders(shop_id);
CREATE INDEX idx_ecommerce_orders_status ON public.ecommerce_orders(status);
CREATE INDEX idx_ecommerce_orders_created_at ON public.ecommerce_orders(created_at);
CREATE INDEX idx_ecommerce_orders_order_number ON public.ecommerce_orders(order_number);

CREATE INDEX idx_ecommerce_order_items_order_id ON public.ecommerce_order_items(order_id);
CREATE INDEX idx_ecommerce_order_items_product_id ON public.ecommerce_order_items(product_id);

CREATE INDEX idx_order_status_history_order_id ON public.order_status_history(order_id);
CREATE INDEX idx_order_status_history_created_at ON public.order_status_history(created_at);

CREATE INDEX idx_ecommerce_payment_transactions_order_id ON public.ecommerce_payment_transactions(order_id);
CREATE INDEX idx_ecommerce_payment_transactions_status ON public.ecommerce_payment_transactions(payment_status);
CREATE INDEX idx_ecommerce_payment_transactions_transaction_id ON public.ecommerce_payment_transactions(transaction_id);

CREATE INDEX idx_product_reviews_product_id ON public.product_reviews(product_id);
CREATE INDEX idx_product_reviews_user_id ON public.product_reviews(user_id);
CREATE INDEX idx_product_reviews_rating ON public.product_reviews(rating);
CREATE INDEX idx_product_reviews_approved ON public.product_reviews(is_approved) WHERE is_approved = true;

CREATE INDEX idx_wishlists_user_id ON public.wishlists(user_id);
CREATE INDEX idx_wishlists_product_id ON public.wishlists(product_id);

CREATE INDEX idx_ecommerce_coupon_usage_coupon_id ON public.ecommerce_coupon_usage(coupon_id);
CREATE INDEX idx_ecommerce_coupon_usage_order_id ON public.ecommerce_coupon_usage(order_id);
CREATE INDEX idx_ecommerce_coupon_usage_user_id ON public.ecommerce_coupon_usage(user_id);