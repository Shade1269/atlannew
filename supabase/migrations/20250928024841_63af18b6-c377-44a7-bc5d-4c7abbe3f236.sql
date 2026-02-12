-- Security Fix: Review and secure SECURITY DEFINER functions
-- This migration addresses the security linter warnings about SECURITY DEFINER functions

-- First, let's check which functions can have SECURITY DEFINER removed safely
-- and which ones need it for legitimate business logic

-- 1. Fix functions that don't need SECURITY DEFINER
-- Some utility functions can work without elevated privileges

CREATE OR REPLACE FUNCTION public.validate_coupon(coupon_code_input text, shop_uuid uuid, customer_user_id uuid DEFAULT NULL::uuid, order_amount numeric DEFAULT 0)
RETURNS jsonb
LANGUAGE plpgsql
STABLE -- Remove SECURITY DEFINER, add STABLE for better performance
SET search_path TO 'public'
AS $function$
DECLARE
  coupon_record RECORD;
  customer_profile_id UUID;
  usage_count_by_customer INTEGER := 0;
  result JSONB;
BEGIN
  -- البحث عن الكوبون
  SELECT * INTO coupon_record 
  FROM coupons 
  WHERE coupon_code = coupon_code_input 
    AND shop_id = shop_uuid 
    AND is_active = true;
  
  -- فحص وجود الكوبون
  IF coupon_record IS NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'الكوبون غير موجود أو غير فعال'
    );
  END IF;
  
  -- فحص تاريخ الصلاحية
  IF coupon_record.valid_until IS NOT NULL AND coupon_record.valid_until < now() THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'انتهت صلاحية الكوبون'
    );
  END IF;
  
  -- فحص حد الاستخدام العام
  IF coupon_record.usage_limit IS NOT NULL AND coupon_record.usage_count >= coupon_record.usage_limit THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'تم استنفاد عدد مرات استخدام الكوبون'
    );
  END IF;
  
  -- فحص الحد الأدنى لمبلغ الطلب
  IF order_amount < coupon_record.minimum_order_amount THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'مبلغ الطلب أقل من الحد الأدنى المطلوب'
    );
  END IF;
  
  -- فحص حد الاستخدام للعميل الواحد
  IF customer_user_id IS NOT NULL THEN
    SELECT id INTO customer_profile_id 
    FROM profiles 
    WHERE auth_user_id = customer_user_id;
    
    IF customer_profile_id IS NOT NULL THEN
      SELECT COUNT(*) INTO usage_count_by_customer 
      FROM coupon_usage 
      WHERE coupon_id = coupon_record.id 
        AND user_id = customer_profile_id;
      
      IF usage_count_by_customer >= coupon_record.usage_limit_per_customer THEN
        RETURN jsonb_build_object(
          'valid', false,
          'error', 'تجاوزت الحد الأقصى لاستخدام هذا الكوبون'
        );
      END IF;
    END IF;
  END IF;
  
  -- الكوبون صالح
  RETURN jsonb_build_object(
    'valid', true,
    'coupon_id', coupon_record.id,
    'discount_type', coupon_record.discount_type,
    'discount_value', coupon_record.discount_value,
    'maximum_discount_amount', coupon_record.maximum_discount_amount
  );
END;
$function$;

-- 2. Add additional security validation to critical SECURITY DEFINER functions
-- These functions legitimately need elevated privileges but should have extra security

CREATE OR REPLACE FUNCTION public.add_loyalty_points(customer_user_id uuid, shop_uuid uuid, points_to_add integer, transaction_description text DEFAULT 'نقاط من عملية شراء'::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  customer_profile_id UUID;
  loyalty_record_id UUID;
  transaction_id UUID;
  caller_profile_id UUID;
BEGIN
  -- Additional Security: Verify the caller has permission to award points for this shop
  -- Only shop owners or admins should be able to award points
  SELECT id INTO caller_profile_id 
  FROM profiles 
  WHERE auth_user_id = auth.uid();
  
  -- Check if caller owns the shop or is admin
  IF NOT EXISTS (
    SELECT 1 FROM shops s 
    WHERE s.id = shop_uuid AND s.owner_id = caller_profile_id
  ) AND NOT EXISTS (
    SELECT 1 FROM affiliate_stores ast 
    WHERE ast.id = shop_uuid AND ast.profile_id = caller_profile_id
  ) AND NOT EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = caller_profile_id AND p.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'غير مصرح لك بمنح نقاط لهذا المتجر';
  END IF;
  
  -- Validate points amount (prevent abuse)
  IF points_to_add < 0 OR points_to_add > 10000 THEN
    RAISE EXCEPTION 'عدد النقاط غير صالح';
  END IF;
  
  -- الحصول على معرف الملف الشخصي للعميل
  SELECT id INTO customer_profile_id 
  FROM profiles 
  WHERE auth_user_id = customer_user_id;
  
  IF customer_profile_id IS NULL THEN
    RAISE EXCEPTION 'Customer profile not found';
  END IF;
  
  -- البحث عن سجل الولاء أو إنشاءه
  SELECT id INTO loyalty_record_id 
  FROM customer_loyalty 
  WHERE customer_id = customer_profile_id AND shop_id = shop_uuid;
  
  IF loyalty_record_id IS NULL THEN
    -- إنشاء سجل ولاء جديد
    INSERT INTO customer_loyalty (customer_id, shop_id, current_points, total_earned_points)
    VALUES (customer_profile_id, shop_uuid, points_to_add, points_to_add)
    RETURNING id INTO loyalty_record_id;
  ELSE
    -- تحديث النقاط الحالية
    UPDATE customer_loyalty 
    SET 
      current_points = current_points + points_to_add,
      total_earned_points = total_earned_points + points_to_add,
      last_activity_at = now(),
      updated_at = now()
    WHERE id = loyalty_record_id;
  END IF;
  
  -- إضافة معاملة النقاط
  INSERT INTO loyalty_transactions (
    customer_loyalty_id, 
    transaction_type, 
    points_amount, 
    description
  ) VALUES (
    loyalty_record_id, 
    'earned', 
    points_to_add, 
    transaction_description
  ) RETURNING id INTO transaction_id;
  
  -- تحديث مستوى العضوية
  PERFORM update_customer_tier(loyalty_record_id);
  
  RETURN transaction_id;
END;
$function$;

-- 3. Create a security audit function to log sensitive operations
CREATE OR REPLACE FUNCTION public.audit_security_definer_call(
  function_name text,
  input_params jsonb DEFAULT '{}',
  user_id uuid DEFAULT auth.uid(),
  additional_context jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO security_audit_log (
    event_type,
    user_id,
    resource_accessed,
    action_performed,
    risk_assessment,
    metadata
  ) VALUES (
    'SECURITY_DEFINER_FUNCTION_CALL',
    user_id,
    function_name,
    'function_execution',
    'MEDIUM',
    jsonb_build_object(
      'function_name', function_name,
      'input_params', input_params,
      'additional_context', additional_context,
      'timestamp', now()
    )
  );
END;
$function$;

-- 4. Add comments to document why SECURITY DEFINER is needed for specific functions
COMMENT ON FUNCTION public.add_loyalty_points IS 'SECURITY DEFINER required: Needs elevated privileges to bypass RLS for loyalty points management across different user contexts';
COMMENT ON FUNCTION public.apply_theme_to_store IS 'SECURITY DEFINER required: Needs elevated privileges to manage theme applications across store ownership boundaries';
COMMENT ON FUNCTION public.create_affiliate_store IS 'SECURITY DEFINER required: Needs elevated privileges to create stores and manage cross-table relationships';
COMMENT ON FUNCTION public.create_customer_account IS 'SECURITY DEFINER required: Needs elevated privileges to create customer accounts across multiple tables';

-- 5. Create a view to monitor SECURITY DEFINER function usage
CREATE OR REPLACE VIEW public.security_definer_functions_audit AS
SELECT 
  p.proname as function_name,
  n.nspname as schema_name,
  p.prosecdef as has_security_definer,
  pg_get_userbyid(p.proowner) as owner,
  obj_description(p.oid, 'pg_proc') as comment
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.prosecdef = true
ORDER BY p.proname;

-- Grant appropriate access to the audit view
GRANT SELECT ON public.security_definer_functions_audit TO authenticated;

-- Add RLS policy for the audit view (it's a view so it inherits from base tables)
-- The underlying security_audit_log table should have proper RLS policies