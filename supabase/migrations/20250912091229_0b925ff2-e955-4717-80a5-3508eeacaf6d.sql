-- إصلاح التحذيرات الأمنية - إضافة search_path للدوال الجديدة

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION generate_refund_number()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        NEW.invoice_number := generate_invoice_number();
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION set_refund_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF NEW.refund_number IS NULL OR NEW.refund_number = '' THEN
        NEW.refund_number := generate_refund_number();
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION calculate_invoice_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    -- حساب الضريبة المضافة
    NEW.vat_sar := (NEW.subtotal_sar + NEW.shipping_sar - NEW.discount_sar) * (NEW.vat_rate / 100);
    
    -- حساب المجموع الكلي
    NEW.total_sar := NEW.subtotal_sar + NEW.shipping_sar + NEW.vat_sar - NEW.discount_sar;
    
    RETURN NEW;
END;
$$;