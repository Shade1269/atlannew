-- لما تتغيّر حالة الطلب لـ DELIVERED: أكّد العمولات
create or replace function public.trg_confirm_commissions_on_delivery()
returns trigger as $$
begin
  if new.status = 'DELIVERED' and old.status is distinct from 'DELIVERED' then
    update public.commissions
    set status = 'CONFIRMED', confirmed_at = now()
    where order_id = new.id and status = 'PENDING';
  end if;
  return new;
end; $$ language plpgsql;

drop trigger if exists trg_orders_after_update on public.orders;
create trigger trg_orders_after_update
after update on public.orders
for each row
execute function public.trg_confirm_commissions_on_delivery();

-- Trigger لحساب مجاميع المتجر سريعًا بعد إدراج order
create or replace function public.trg_update_store_totals_after_order()
returns trigger as $$
begin
  update public.affiliate_stores
  set total_orders = total_orders + 1,
      total_sales  = total_sales + new.total_sar,
      updated_at   = now()
  where id = new.affiliate_store_id;
  return new;
end; $$ language plpgsql;

drop trigger if exists trg_orders_after_insert on public.orders;
create trigger trg_orders_after_insert
after insert on public.orders
for each row
execute function public.trg_update_store_totals_after_order();