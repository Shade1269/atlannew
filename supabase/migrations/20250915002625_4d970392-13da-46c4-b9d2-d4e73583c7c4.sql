-- Enable RLS and create policies for affiliate functionality

-- affiliate_stores: Users can manage their own affiliate stores
alter table public.affiliate_stores enable row level security;

-- Drop existing policies first to avoid conflicts
drop policy if exists "Affiliates can manage their own stores" on public.affiliate_stores;
drop policy if exists "Public can view active affiliate stores" on public.affiliate_stores;

create policy "select own affiliate store"
on public.affiliate_stores for select
using (profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

create policy "insert own affiliate store"
on public.affiliate_stores for insert
with check (profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

create policy "update own affiliate store"
on public.affiliate_stores for update
using (profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

create policy "public can view active stores"
on public.affiliate_stores for select
using (is_active = true);

-- affiliate_products: Manage products of own stores
alter table public.affiliate_products enable row level security;

-- Drop existing policies first
drop policy if exists "Affiliates can manage their store products" on public.affiliate_products;
drop policy if exists "Public can view visible affiliate products" on public.affiliate_products;
drop policy if exists "Users can view visible affiliate products" on public.affiliate_products;

create policy "select products of my store"
on public.affiliate_products for select
using (
  affiliate_store_id in (
    select id from public.affiliate_stores 
    where profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
  )
);

create policy "write products of my store"
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

create policy "public can view visible products"
on public.affiliate_products for select
using (is_visible = true);

-- orders: Affiliates can see orders from their stores
alter table public.orders enable row level security;

create policy "affiliates see their store orders"
on public.orders for select
using (
  affiliate_store_id in (
    select id from public.affiliate_stores 
    where profile_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
  )
);

-- commissions: Users see their own commissions
alter table public.commissions enable row level security;

-- Drop existing policy first
drop policy if exists "Users can view own commissions" on public.commissions;

create policy "affiliate sees own commissions"
on public.commissions for select
using (affiliate_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));