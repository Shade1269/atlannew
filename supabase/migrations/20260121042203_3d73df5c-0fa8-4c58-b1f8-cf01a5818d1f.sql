-- Fix: Add missing unique index for inventory_reservations ON CONFLICT
CREATE UNIQUE INDEX IF NOT EXISTS uq_inventory_reservations_order
  ON public.inventory_reservations(reservation_type, reserved_for, inventory_item_id);

CREATE INDEX IF NOT EXISTS idx_inventory_reservations_reserved_for
  ON public.inventory_reservations(reserved_for)
  WHERE reservation_type = 'ORDER';