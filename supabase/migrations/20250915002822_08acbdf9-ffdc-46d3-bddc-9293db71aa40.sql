-- RLS policies for affiliate functionality with unique names

-- affiliate_stores: Drop existing and create new policies
drop policy if exists "Affiliates can manage their own stores" on public.affiliate_stores;
drop policy if exists "Public can view active affiliate stores" on public.affiliate_stores;

create policy "affiliate_select_own_store"
on public.affiliate_stores for select
using (profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()) OR is_active = true);

create policy "affiliate_insert_own_store"
on public.affiliate_stores for insert
with check (profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

create policy "affiliate_update_own_store"
on public.affiliate_stores for update
using (profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

-- affiliate_products: Drop existing and create new policies
drop policy if exists "Affiliates can manage their store products" on public.affiliate_products;
drop policy if exists "Public can view visible affiliate products" on public.affiliate_products;
drop policy if exists "Users can view visible affiliate products" on public.affiliate_products;

create policy "affiliate_select_store_products"
on public.affiliate_products for select
using (
  is_visible = true OR
  affiliate_store_id in (
    select id from public.affiliate_stores 
    where profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
  )
);

create policy "affiliate_manage_store_products"
on public.affiliate_products for all
using (
  affiliate_store_id in (
    select id from public.affiliate_stores 
    where profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
  )
)
with check (
  affiliate_store_id in (
    select id from public.affiliate_stores 
    where profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
  )
);

-- orders: Add policy for affiliates to see their store orders
create policy "affiliate_view_store_orders"
on public.orders for select
using (
  affiliate_store_id in (
    select id from public.affiliate_stores 
    where profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
  )
);

-- commissions: Drop existing and create new policy
drop policy if exists "Users can view own commissions" on public.commissions;
drop policy if exists "Admins can create commissions" on public.commissions;

create policy "affiliate_view_own_commissions"
on public.commissions for select
using (affiliate_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

create policy "admin_manage_commissions"
on public.commissions for all
using (get_current_user_role() = 'admin')
with check (get_current_user_role() = 'admin');