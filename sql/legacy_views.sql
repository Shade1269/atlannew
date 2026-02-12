-- Archived legacy order views
-- These views are provided for historical read-only access outside of the application runtime.
-- The frontend and server code now rely exclusively on ecommerce_* tables.

-- View of the legacy orders table (do not reference from application code).
CREATE OR REPLACE VIEW archived_legacy_orders AS
SELECT *
FROM orders;

-- View of the legacy simple_orders table (do not reference from application code).
CREATE OR REPLACE VIEW archived_legacy_simple_orders AS
SELECT *
FROM simple_orders;
