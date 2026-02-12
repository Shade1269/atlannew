-- Fix security warnings: Set search_path for trigger functions
create or replace function public.trg_confirm_commissions_on_delivery()
returns trigger as $$
begin
  if new.status = 'DELIVERED' and old.status is distinct from 'DELIVERED' then
    update public.commissions
    set status = 'CONFIRMED', confirmed_at = now()
    where order_id = new.id and status = 'PENDING';
  end if;
  return new;
end; $$ language plpgsql security definer set search_path = public;

create or replace function public.trg_update_store_totals_after_order()
returns trigger as $$
begin
  if new.affiliate_store_id IS NOT NULL then
    update public.affiliate_stores
    set total_orders = total_orders + 1,
        total_sales  = total_sales + COALESCE(new.total_sar, 0),
        updated_at   = now()
    where id = new.affiliate_store_id;
  end if;
  return new;
end; $$ language plpgsql security definer set search_path = public;