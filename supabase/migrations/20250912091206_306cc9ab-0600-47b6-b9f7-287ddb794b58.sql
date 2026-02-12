-- إنشاء جداول نظام الدفع والمحاسبة المتقدم

-- جدول الفواتير الضريبية
CREATE TABLE public.invoices (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_number TEXT UNIQUE NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
    customer_profile_id UUID REFERENCES public.profiles(id),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    customer_address JSONB NOT NULL,
    
    -- المبالغ المالية
    subtotal_sar NUMERIC(10,2) NOT NULL DEFAULT 0,
    discount_sar NUMERIC(10,2) NOT NULL DEFAULT 0,
    shipping_sar NUMERIC(10,2) NOT NULL DEFAULT 0,
    vat_rate NUMERIC(5,2) NOT NULL DEFAULT 15.00,
    vat_sar NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_sar NUMERIC(10,2) NOT NULL DEFAULT 0,
    
    -- معلومات الضريبة
    tax_registration_number TEXT,
    vat_breakdown JSONB DEFAULT '{}',
    
    -- حالة الفاتورة
    status TEXT NOT NULL DEFAULT 'DRAFT',
    payment_status TEXT NOT NULL DEFAULT 'PENDING',
    
    -- تواريخ مهمة
    issue_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    due_date TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- ملاحظات وبيانات إضافية
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول عناصر الفاتورة
CREATE TABLE public.invoice_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id),
    
    -- تفاصيل المنتج (لحفظ البيانات في وقت الفاتورة)
    item_name TEXT NOT NULL,
    item_description TEXT,
    item_sku TEXT,
    
    -- الكميات والأسعار
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price_sar NUMERIC(10,2) NOT NULL,
    discount_sar NUMERIC(10,2) NOT NULL DEFAULT 0,
    subtotal_sar NUMERIC(10,2) NOT NULL,
    vat_rate NUMERIC(5,2) NOT NULL DEFAULT 15.00,
    vat_sar NUMERIC(10,2) NOT NULL,
    total_sar NUMERIC(10,2) NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول إعدادات بوابات الدفع
CREATE TABLE public.payment_gateways (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
    
    -- معلومات البوابة
    gateway_name TEXT NOT NULL, -- 'tamara', 'tabby', 'mada', 'visa', 'mastercard', 'stcpay', 'applepay'
    display_name TEXT NOT NULL,
    provider TEXT NOT NULL, -- 'emkan', 'payfort', 'hyperpay', etc.
    
    -- إعدادات الاتصال
    api_key TEXT,
    secret_key TEXT,
    merchant_id TEXT,
    api_url TEXT,
    webhook_url TEXT,
    
    -- إعدادات التفعيل
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    is_test_mode BOOLEAN NOT NULL DEFAULT true,
    
    -- إعدادات الرسوم
    fixed_fee_sar NUMERIC(8,2) DEFAULT 0,
    percentage_fee NUMERIC(5,2) DEFAULT 0,
    
    -- إعدادات أخرى
    min_amount_sar NUMERIC(10,2) DEFAULT 0,
    max_amount_sar NUMERIC(10,2),
    allowed_currencies TEXT[] DEFAULT ARRAY['SAR'],
    
    -- تكوين إضافي
    configuration JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول معاملات الدفع المفصلة
CREATE TABLE public.payment_transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id TEXT UNIQUE NOT NULL,
    payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES public.invoices(id),
    order_id UUID REFERENCES public.orders(id),
    gateway_id UUID REFERENCES public.payment_gateways(id),
    
    -- تفاصيل المعاملة
    amount_sar NUMERIC(10,2) NOT NULL,
    gateway_fee_sar NUMERIC(8,2) DEFAULT 0,
    net_amount_sar NUMERIC(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'SAR',
    
    -- معلومات البوابة
    gateway_transaction_id TEXT,
    gateway_reference TEXT,
    gateway_response JSONB DEFAULT '{}',
    
    -- حالة المعاملة
    status TEXT NOT NULL DEFAULT 'PENDING',
    failure_reason TEXT,
    
    -- تواريخ المعاملة
    initiated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    
    -- بيانات إضافية
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول المرتجعات والاستردادات
CREATE TABLE public.refunds (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    refund_number TEXT UNIQUE NOT NULL,
    order_id UUID NOT NULL REFERENCES public.orders(id),
    invoice_id UUID REFERENCES public.invoices(id),
    payment_id UUID REFERENCES public.payments(id),
    
    -- معلومات المرتجع
    refund_type TEXT NOT NULL DEFAULT 'FULL', -- 'FULL', 'PARTIAL'
    reason TEXT NOT NULL,
    description TEXT,
    
    -- المبالغ
    original_amount_sar NUMERIC(10,2) NOT NULL,
    refund_amount_sar NUMERIC(10,2) NOT NULL,
    refund_fee_sar NUMERIC(8,2) DEFAULT 0,
    net_refund_sar NUMERIC(10,2) NOT NULL,
    
    -- حالة المرتجع
    status TEXT NOT NULL DEFAULT 'REQUESTED',
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- معلومات الاسترداد
    refund_method TEXT, -- 'ORIGINAL_PAYMENT', 'BANK_TRANSFER', 'CASH'
    gateway_refund_id TEXT,
    gateway_response JSONB DEFAULT '{}',
    
    -- تواريخ
    requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    processed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- ملاحظات
    admin_notes TEXT,
    customer_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول عناصر المرتجعات
CREATE TABLE public.refund_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    refund_id UUID NOT NULL REFERENCES public.refunds(id) ON DELETE CASCADE,
    order_item_id UUID NOT NULL REFERENCES public.order_items(id),
    
    -- تفاصيل المرتجع
    quantity_returned INTEGER NOT NULL,
    unit_price_sar NUMERIC(10,2) NOT NULL,
    total_refund_sar NUMERIC(10,2) NOT NULL,
    
    -- حالة العنصر
    condition_on_return TEXT, -- 'NEW', 'USED', 'DAMAGED'
    return_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء الفهارس للأداء
CREATE INDEX idx_invoices_shop_id ON public.invoices(shop_id);
CREATE INDEX idx_invoices_order_id ON public.invoices(order_id);
CREATE INDEX idx_invoices_invoice_number ON public.invoices(invoice_number);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_payment_status ON public.invoices(payment_status);
CREATE INDEX idx_invoices_issue_date ON public.invoices(issue_date);

CREATE INDEX idx_payment_transactions_payment_id ON public.payment_transactions(payment_id);
CREATE INDEX idx_payment_transactions_gateway_id ON public.payment_transactions(gateway_id);
CREATE INDEX idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX idx_payment_transactions_transaction_id ON public.payment_transactions(transaction_id);

CREATE INDEX idx_refunds_order_id ON public.refunds(order_id);
CREATE INDEX idx_refunds_status ON public.refunds(status);
CREATE INDEX idx_refunds_refund_number ON public.refunds(refund_number);

-- تمكين RLS على الجداول الجديدة
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_items ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للفواتير
CREATE POLICY "Shop owners can manage their invoices" ON public.invoices
    FOR ALL USING (shop_id IN (
        SELECT s.id FROM shops s 
        JOIN profiles p ON p.id = s.owner_id 
        WHERE p.auth_user_id = auth.uid()
    ));

CREATE POLICY "Admins can manage all invoices" ON public.invoices
    FOR ALL USING (get_current_user_role() = 'admin');

-- سياسات عناصر الفواتير
CREATE POLICY "Shop owners can manage their invoice items" ON public.invoice_items
    FOR ALL USING (invoice_id IN (
        SELECT i.id FROM invoices i 
        JOIN shops s ON s.id = i.shop_id 
        JOIN profiles p ON p.id = s.owner_id 
        WHERE p.auth_user_id = auth.uid()
    ));

-- سياسات بوابات الدفع
CREATE POLICY "Shop owners can manage their payment gateways" ON public.payment_gateways
    FOR ALL USING (shop_id IN (
        SELECT s.id FROM shops s 
        JOIN profiles p ON p.id = s.owner_id 
        WHERE p.auth_user_id = auth.uid()
    ));

CREATE POLICY "Admins can manage all payment gateways" ON public.payment_gateways
    FOR ALL USING (get_current_user_role() = 'admin');

-- سياسات معاملات الدفع
CREATE POLICY "Shop owners can view their payment transactions" ON public.payment_transactions
    FOR SELECT USING (order_id IN (
        SELECT o.id FROM orders o 
        JOIN shops s ON s.id = o.shop_id 
        JOIN profiles p ON p.id = s.owner_id 
        WHERE p.auth_user_id = auth.uid()
    ));

CREATE POLICY "Only service role can insert payment transactions" ON public.payment_transactions
    FOR INSERT WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

-- سياسات المرتجعات
CREATE POLICY "Shop owners can manage their refunds" ON public.refunds
    FOR ALL USING (order_id IN (
        SELECT o.id FROM orders o 
        JOIN shops s ON s.id = o.shop_id 
        JOIN profiles p ON p.id = s.owner_id 
        WHERE p.auth_user_id = auth.uid()
    ));

CREATE POLICY "Admins can manage all refunds" ON public.refunds
    FOR ALL USING (get_current_user_role() = 'admin');

-- سياسات عناصر المرتجعات
CREATE POLICY "Shop owners can manage their refund items" ON public.refund_items
    FOR ALL USING (refund_id IN (
        SELECT r.id FROM refunds r 
        JOIN orders o ON o.id = r.order_id 
        JOIN shops s ON s.id = o.shop_id 
        JOIN profiles p ON p.id = s.owner_id 
        WHERE p.auth_user_id = auth.uid()
    ));

-- دوال مساعدة لتوليد أرقام الفواتير والمرتجعات
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    current_year TEXT;
    current_month TEXT;
    sequence_num INTEGER;
BEGIN
    current_year := EXTRACT(YEAR FROM NOW())::TEXT;
    current_month := LPAD(EXTRACT(MONTH FROM NOW())::TEXT, 2, '0');
    
    -- البحث عن آخر رقم فاتورة في الشهر الحالي
    SELECT COALESCE(
        MAX(CAST(SUBSTRING(invoice_number FROM 8) AS INTEGER)), 0
    ) + 1 INTO sequence_num
    FROM invoices 
    WHERE invoice_number LIKE 'INV' || current_year || current_month || '%';
    
    RETURN 'INV' || current_year || current_month || LPAD(sequence_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_refund_number()
RETURNS TEXT AS $$
DECLARE
    current_year TEXT;
    current_month TEXT;
    sequence_num INTEGER;
BEGIN
    current_year := EXTRACT(YEAR FROM NOW())::TEXT;
    current_month := LPAD(EXTRACT(MONTH FROM NOW())::TEXT, 2, '0');
    
    SELECT COALESCE(
        MAX(CAST(SUBSTRING(refund_number FROM 8) AS INTEGER)), 0
    ) + 1 INTO sequence_num
    FROM refunds 
    WHERE refund_number LIKE 'REF' || current_year || current_month || '%';
    
    RETURN 'REF' || current_year || current_month || LPAD(sequence_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- تريجرز لتوليد الأرقام التلقائية
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        NEW.invoice_number := generate_invoice_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_refund_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.refund_number IS NULL OR NEW.refund_number = '' THEN
        NEW.refund_number := generate_refund_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_invoice_number
    BEFORE INSERT ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION set_invoice_number();

CREATE TRIGGER trigger_set_refund_number
    BEFORE INSERT ON public.refunds
    FOR EACH ROW EXECUTE FUNCTION set_refund_number();

-- تريجر لحساب الضريبة تلقائياً
CREATE OR REPLACE FUNCTION calculate_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- حساب الضريبة المضافة
    NEW.vat_sar := (NEW.subtotal_sar + NEW.shipping_sar - NEW.discount_sar) * (NEW.vat_rate / 100);
    
    -- حساب المجموع الكلي
    NEW.total_sar := NEW.subtotal_sar + NEW.shipping_sar + NEW.vat_sar - NEW.discount_sar;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_invoice_totals
    BEFORE INSERT OR UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION calculate_invoice_totals();