-- Ensure helper function exists
create or replace function public.order_exists_no_rls(p_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.ecommerce_orders where id = p_order_id
  );
$$;

-- New policy allowing anon/authenticated to insert order items when the order exists
create policy "Public can insert order items via function"
on public.ecommerce_order_items
for insert
to anon, authenticated
with check (
  public.order_exists_no_rls(order_id)
);
