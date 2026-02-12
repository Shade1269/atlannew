-- Add invoice columns to order_hub table
ALTER TABLE public.order_hub 
ADD COLUMN IF NOT EXISTS zoho_invoice_number TEXT,
ADD COLUMN IF NOT EXISTS zoho_invoice_id TEXT,
ADD COLUMN IF NOT EXISTS zoho_invoice_url TEXT;