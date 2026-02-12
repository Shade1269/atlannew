-- -----------------------------------------------------------------------------
-- 01_policies.sql
-- Core row-level security policies for Anaqti commerce tables.
-- -----------------------------------------------------------------------------

-- Ensure row level security is enabled on the core tables.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

ALTER TABLE public.affiliate_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_stores FORCE ROW LEVEL SECURITY;

ALTER TABLE public.ecommerce_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecommerce_orders FORCE ROW LEVEL SECURITY;

ALTER TABLE public.ecommerce_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecommerce_order_items FORCE ROW LEVEL SECURITY;

ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions FORCE ROW LEVEL SECURITY;

ALTER TABLE public.points_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_events FORCE ROW LEVEL SECURITY;

-- Convenience predicates -------------------------------------------------------
-- Inline checks keep the policies declarative without relying on helper
-- functions that could bypass RLS protections.

-- Profiles --------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_self" ON public.profiles;
CREATE POLICY "profiles_select_self"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND auth_user_id = auth.uid()
);

DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
CREATE POLICY "profiles_select_admin"
ON public.profiles
FOR SELECT
USING (
  auth.role() = 'service_role'
  OR EXISTS (
    SELECT 1
    FROM public.profiles admin_profile
    WHERE admin_profile.auth_user_id = auth.uid()
      AND admin_profile.role = 'admin'
  )
);

DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
CREATE POLICY "profiles_update_self"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND auth_user_id = auth.uid()
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND auth_user_id = auth.uid()
);

DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
CREATE POLICY "profiles_update_admin"
ON public.profiles
FOR UPDATE
USING (
  auth.role() = 'service_role'
  OR EXISTS (
    SELECT 1
    FROM public.profiles admin_profile
    WHERE admin_profile.auth_user_id = auth.uid()
      AND admin_profile.role = 'admin'
  )
)
WITH CHECK (
  auth.role() = 'service_role'
  OR EXISTS (
    SELECT 1
    FROM public.profiles admin_profile
    WHERE admin_profile.auth_user_id = auth.uid()
      AND admin_profile.role = 'admin'
  )
);

DROP POLICY IF EXISTS "profiles_insert_service" ON public.profiles;
CREATE POLICY "profiles_insert_service"
ON public.profiles
FOR INSERT
WITH CHECK (
  auth.role() = 'service_role'
  OR EXISTS (
    SELECT 1
    FROM public.profiles admin_profile
    WHERE admin_profile.auth_user_id = auth.uid()
      AND admin_profile.role = 'admin'
  )
);

DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
CREATE POLICY "profiles_delete_admin"
ON public.profiles
FOR DELETE
USING (
  auth.role() = 'service_role'
  OR EXISTS (
    SELECT 1
    FROM public.profiles admin_profile
    WHERE admin_profile.auth_user_id = auth.uid()
      AND admin_profile.role = 'admin'
  )
);

-- Affiliate stores ------------------------------------------------------------
DROP POLICY IF EXISTS "affiliate_stores_owner_all" ON public.affiliate_stores;
CREATE POLICY "affiliate_stores_owner_all"
ON public.affiliate_stores
FOR ALL
USING (
  auth.role() = 'service_role'
  OR (
    auth.uid() IS NOT NULL
    AND (
      profile_id = (
        SELECT p.id FROM public.profiles p WHERE p.auth_user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1
        FROM public.profiles admin_profile
        WHERE admin_profile.auth_user_id = auth.uid()
          AND admin_profile.role = 'admin'
      )
    )
  )
)
WITH CHECK (
  auth.role() = 'service_role'
  OR (
    auth.uid() IS NOT NULL
    AND (
      profile_id = (
        SELECT p.id FROM public.profiles p WHERE p.auth_user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1
        FROM public.profiles admin_profile
        WHERE admin_profile.auth_user_id = auth.uid()
          AND admin_profile.role = 'admin'
      )
    )
  )
);

-- Ecommerce orders ------------------------------------------------------------
DROP POLICY IF EXISTS "ecommerce_orders_select_role_based" ON public.ecommerce_orders;
CREATE POLICY "ecommerce_orders_select_role_based"
ON public.ecommerce_orders
FOR SELECT
USING (
  auth.role() = 'service_role'
  OR EXISTS (
    SELECT 1
    FROM public.profiles admin_profile
    WHERE admin_profile.auth_user_id = auth.uid()
      AND admin_profile.role = 'admin'
  )
  OR shop_id IN (
    SELECT s.id
    FROM public.shops s
    WHERE s.owner_id = (
      SELECT p.id FROM public.profiles p WHERE p.auth_user_id = auth.uid()
    )
  )
  OR affiliate_store_id IN (
    SELECT ast.id
    FROM public.affiliate_stores ast
    WHERE ast.profile_id = (
      SELECT p.id FROM public.profiles p WHERE p.auth_user_id = auth.uid()
    )
  )
  OR user_id = (
    SELECT p.id FROM public.profiles p WHERE p.auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "ecommerce_orders_update_role_based" ON public.ecommerce_orders;
CREATE POLICY "ecommerce_orders_update_role_based"
ON public.ecommerce_orders
FOR UPDATE
USING (
  auth.role() = 'service_role'
  OR EXISTS (
    SELECT 1
    FROM public.profiles admin_profile
    WHERE admin_profile.auth_user_id = auth.uid()
      AND admin_profile.role = 'admin'
  )
  OR shop_id IN (
    SELECT s.id
    FROM public.shops s
    WHERE s.owner_id = (
      SELECT p.id FROM public.profiles p WHERE p.auth_user_id = auth.uid()
    )
  )
)
WITH CHECK (
  auth.role() = 'service_role'
  OR EXISTS (
    SELECT 1
    FROM public.profiles admin_profile
    WHERE admin_profile.auth_user_id = auth.uid()
      AND admin_profile.role = 'admin'
  )
  OR shop_id IN (
    SELECT s.id
    FROM public.shops s
    WHERE s.owner_id = (
      SELECT p.id FROM public.profiles p WHERE p.auth_user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "ecommerce_orders_insert_controlled" ON public.ecommerce_orders;
CREATE POLICY "ecommerce_orders_insert_controlled"
ON public.ecommerce_orders
FOR INSERT
WITH CHECK (
  auth.role() = 'service_role'
  OR EXISTS (
    SELECT 1
    FROM public.profiles admin_profile
    WHERE admin_profile.auth_user_id = auth.uid()
      AND admin_profile.role = 'admin'
  )
  OR shop_id IN (
    SELECT s.id
    FROM public.shops s
    WHERE s.owner_id = (
      SELECT p.id FROM public.profiles p WHERE p.auth_user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "ecommerce_orders_delete_admin" ON public.ecommerce_orders;
CREATE POLICY "ecommerce_orders_delete_admin"
ON public.ecommerce_orders
FOR DELETE
USING (
  auth.role() = 'service_role'
  OR EXISTS (
    SELECT 1
    FROM public.profiles admin_profile
    WHERE admin_profile.auth_user_id = auth.uid()
      AND admin_profile.role = 'admin'
  )
);

-- Ecommerce order items ------------------------------------------------------
DROP POLICY IF EXISTS "ecommerce_order_items_select_via_orders" ON public.ecommerce_order_items;
CREATE POLICY "ecommerce_order_items_select_via_orders"
ON public.ecommerce_order_items
FOR SELECT
USING (
  auth.role() = 'service_role'
  OR EXISTS (
    SELECT 1
    FROM public.profiles admin_profile
    WHERE admin_profile.auth_user_id = auth.uid()
      AND admin_profile.role = 'admin'
  )
  OR order_id IN (
    SELECT eo.id
    FROM public.ecommerce_orders eo
    WHERE eo.shop_id IN (
      SELECT s.id
      FROM public.shops s
      WHERE s.owner_id = (
        SELECT p.id FROM public.profiles p WHERE p.auth_user_id = auth.uid()
      )
    )
    OR eo.affiliate_store_id IN (
      SELECT ast.id
      FROM public.affiliate_stores ast
      WHERE ast.profile_id = (
        SELECT p.id FROM public.profiles p WHERE p.auth_user_id = auth.uid()
      )
    )
    OR eo.user_id = (
      SELECT p.id FROM public.profiles p WHERE p.auth_user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "ecommerce_order_items_update_role_based" ON public.ecommerce_order_items;
CREATE POLICY "ecommerce_order_items_update_role_based"
ON public.ecommerce_order_items
FOR UPDATE
USING (
  auth.role() = 'service_role'
  OR EXISTS (
    SELECT 1
    FROM public.profiles admin_profile
    WHERE admin_profile.auth_user_id = auth.uid()
      AND admin_profile.role = 'admin'
  )
  OR order_id IN (
    SELECT eo.id
    FROM public.ecommerce_orders eo
    WHERE eo.shop_id IN (
      SELECT s.id
      FROM public.shops s
      WHERE s.owner_id = (
        SELECT p.id FROM public.profiles p WHERE p.auth_user_id = auth.uid()
      )
    )
  )
)
WITH CHECK (
  auth.role() = 'service_role'
  OR EXISTS (
    SELECT 1
    FROM public.profiles admin_profile
    WHERE admin_profile.auth_user_id = auth.uid()
      AND admin_profile.role = 'admin'
  )
  OR order_id IN (
    SELECT eo.id
    FROM public.ecommerce_orders eo
    WHERE eo.shop_id IN (
      SELECT s.id
      FROM public.shops s
      WHERE s.owner_id = (
        SELECT p.id FROM public.profiles p WHERE p.auth_user_id = auth.uid()
      )
    )
  )
);

DROP POLICY IF EXISTS "ecommerce_order_items_insert_controlled" ON public.ecommerce_order_items;
CREATE POLICY "ecommerce_order_items_insert_controlled"
ON public.ecommerce_order_items
FOR INSERT
WITH CHECK (
  auth.role() = 'service_role'
  OR EXISTS (
    SELECT 1
    FROM public.profiles admin_profile
    WHERE admin_profile.auth_user_id = auth.uid()
      AND admin_profile.role = 'admin'
  )
  OR order_id IN (
    SELECT eo.id
    FROM public.ecommerce_orders eo
    WHERE eo.shop_id IN (
      SELECT s.id
      FROM public.shops s
      WHERE s.owner_id = (
        SELECT p.id FROM public.profiles p WHERE p.auth_user_id = auth.uid()
      )
    )
  )
);

DROP POLICY IF EXISTS "ecommerce_order_items_delete_admin" ON public.ecommerce_order_items;
CREATE POLICY "ecommerce_order_items_delete_admin"
ON public.ecommerce_order_items
FOR DELETE
USING (
  auth.role() = 'service_role'
  OR EXISTS (
    SELECT 1
    FROM public.profiles admin_profile
    WHERE admin_profile.auth_user_id = auth.uid()
      AND admin_profile.role = 'admin'
  )
);

-- Commissions -----------------------------------------------------------------
DROP POLICY IF EXISTS "commissions_select_role_based" ON public.commissions;
CREATE POLICY "commissions_select_role_based"
ON public.commissions
FOR SELECT
USING (
  auth.role() = 'service_role'
  OR EXISTS (
    SELECT 1
    FROM public.profiles admin_profile
    WHERE admin_profile.auth_user_id = auth.uid()
      AND admin_profile.role = 'admin'
  )
  OR affiliate_id = (
    SELECT p.id FROM public.profiles p WHERE p.auth_user_id = auth.uid()
  )
  OR affiliate_profile_id = (
    SELECT p.id FROM public.profiles p WHERE p.auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "commissions_update_admin" ON public.commissions;
CREATE POLICY "commissions_update_admin"
ON public.commissions
FOR UPDATE
USING (
  auth.role() = 'service_role'
  OR EXISTS (
    SELECT 1
    FROM public.profiles admin_profile
    WHERE admin_profile.auth_user_id = auth.uid()
      AND admin_profile.role = 'admin'
  )
)
WITH CHECK (
  auth.role() = 'service_role'
  OR EXISTS (
    SELECT 1
    FROM public.profiles admin_profile
    WHERE admin_profile.auth_user_id = auth.uid()
      AND admin_profile.role = 'admin'
  )
);

DROP POLICY IF EXISTS "commissions_insert_controlled" ON public.commissions;
CREATE POLICY "commissions_insert_controlled"
ON public.commissions
FOR INSERT
WITH CHECK (
  auth.role() = 'service_role'
  OR EXISTS (
    SELECT 1
    FROM public.profiles admin_profile
    WHERE admin_profile.auth_user_id = auth.uid()
      AND admin_profile.role = 'admin'
  )
);

DROP POLICY IF EXISTS "commissions_delete_admin" ON public.commissions;
CREATE POLICY "commissions_delete_admin"
ON public.commissions
FOR DELETE
USING (
  auth.role() = 'service_role'
  OR EXISTS (
    SELECT 1
    FROM public.profiles admin_profile
    WHERE admin_profile.auth_user_id = auth.uid()
      AND admin_profile.role = 'admin'
  )
);

-- Points events ---------------------------------------------------------------
DROP POLICY IF EXISTS "points_events_select_role_based" ON public.points_events;
CREATE POLICY "points_events_select_role_based"
ON public.points_events
FOR SELECT
USING (
  auth.role() = 'service_role'
  OR EXISTS (
    SELECT 1
    FROM public.profiles admin_profile
    WHERE admin_profile.auth_user_id = auth.uid()
      AND admin_profile.role = 'admin'
  )
  OR affiliate_id = (
    SELECT p.id FROM public.profiles p WHERE p.auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "points_events_insert_controlled" ON public.points_events;
CREATE POLICY "points_events_insert_controlled"
ON public.points_events
FOR INSERT
WITH CHECK (
  auth.role() = 'service_role'
  OR EXISTS (
    SELECT 1
    FROM public.profiles admin_profile
    WHERE admin_profile.auth_user_id = auth.uid()
      AND admin_profile.role = 'admin'
  )
);

DROP POLICY IF EXISTS "points_events_update_admin" ON public.points_events;
CREATE POLICY "points_events_update_admin"
ON public.points_events
FOR UPDATE
USING (
  auth.role() = 'service_role'
  OR EXISTS (
    SELECT 1
    FROM public.profiles admin_profile
    WHERE admin_profile.auth_user_id = auth.uid()
      AND admin_profile.role = 'admin'
  )
)
WITH CHECK (
  auth.role() = 'service_role'
  OR EXISTS (
    SELECT 1
    FROM public.profiles admin_profile
    WHERE admin_profile.auth_user_id = auth.uid()
      AND admin_profile.role = 'admin'
  )
);

DROP POLICY IF EXISTS "points_events_delete_admin" ON public.points_events;
CREATE POLICY "points_events_delete_admin"
ON public.points_events
FOR DELETE
USING (
  auth.role() = 'service_role'
  OR EXISTS (
    SELECT 1
    FROM public.profiles admin_profile
    WHERE admin_profile.auth_user_id = auth.uid()
      AND admin_profile.role = 'admin'
  )
);
