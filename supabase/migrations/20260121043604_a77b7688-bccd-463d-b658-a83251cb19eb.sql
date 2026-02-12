
-- تعديل inventory_movements للسماح بـ NULL في created_by للعمليات التلقائية
ALTER TABLE inventory_movements 
ALTER COLUMN created_by DROP NOT NULL;

-- تحديث الـ trigger مع comment توضيحي
COMMENT ON COLUMN inventory_movements.created_by IS 'User who created the movement. NULL for system-generated movements (e.g., auto-fulfillment triggers)';
