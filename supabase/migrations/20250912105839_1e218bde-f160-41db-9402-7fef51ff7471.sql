-- إصلاح مشاكل الأمان للدوال الجديدة

-- إعادة إنشاء دالة تحديث الكميات مع search_path آمن
CREATE OR REPLACE FUNCTION public.update_inventory_item_quantities()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- تحديث الكمية المحجوزة
    UPDATE public.inventory_items 
    SET quantity_reserved = (
        SELECT COALESCE(SUM(reserved_quantity), 0) 
        FROM public.inventory_reservations 
        WHERE inventory_item_id = NEW.inventory_item_id 
        AND status = 'ACTIVE'
    )
    WHERE id = NEW.inventory_item_id;
    
    RETURN NEW;
END;
$$;

-- إعادة إنشاء دالة التنبيهات مع search_path آمن
CREATE OR REPLACE FUNCTION public.check_stock_alerts()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- تنبيه نفاد المخزون
    IF NEW.quantity_available = 0 THEN
        INSERT INTO public.stock_alerts (inventory_item_id, alert_type, priority, message)
        VALUES (NEW.id, 'OUT_OF_STOCK', 'CRITICAL', 'المنتج نفد من المخزون تماماً')
        ON CONFLICT DO NOTHING;
    
    -- تنبيه انخفاض المخزون
    ELSIF NEW.quantity_available <= NEW.reorder_level AND NEW.reorder_level > 0 THEN
        INSERT INTO public.stock_alerts (inventory_item_id, alert_type, priority, message)
        VALUES (NEW.id, 'LOW_STOCK', 'HIGH', 'المخزون أقل من الحد الأدنى المطلوب')
        ON CONFLICT DO NOTHING;
    
    -- تنبيه زيادة المخزون
    ELSIF NEW.max_stock_level IS NOT NULL AND NEW.quantity_available > NEW.max_stock_level THEN
        INSERT INTO public.stock_alerts (inventory_item_id, alert_type, priority, message)
        VALUES (NEW.id, 'OVERSTOCK', 'MEDIUM', 'المخزون يتجاوز الحد الأقصى المسموح')
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- تنبيه انتهاء الصلاحية
    IF NEW.expiry_date IS NOT NULL AND NEW.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN
        INSERT INTO public.stock_alerts (inventory_item_id, alert_type, priority, message)
        VALUES (NEW.id, 'EXPIRING_SOON', 'HIGH', 'المنتج سينتهي صلاحيته قريباً')
        ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$;