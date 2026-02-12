
-- تحديث slug المتجر "Ggg" من "fatima" إلى "ggg"
UPDATE affiliate_stores
SET store_slug = 'ggg',
    updated_at = now()
WHERE id = 'e22c6743-07ae-4116-bf80-61cb4ffb035c'
  AND store_name = 'Ggg';
