-- Add Zoho invoice tracking columns to order_hub table
ALTER TABLE public.order_hub 
ADD COLUMN IF NOT EXISTS zoho_sync_status TEXT DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS zoho_invoice_number TEXT,
ADD COLUMN IF NOT EXISTS zoho_invoice_id TEXT,
ADD COLUMN IF NOT EXISTS zoho_invoice_url TEXT,
ADD COLUMN IF NOT EXISTS zoho_error_message TEXT;