-- جدول تنبيهات توفر المخزون
CREATE TABLE IF NOT EXISTS public.stock_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  affiliate_store_id UUID REFERENCES public.affiliate_stores(id) ON DELETE CASCADE,
  is_notified BOOLEAN DEFAULT false,
  notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stock_alerts
CREATE POLICY "Anyone can create stock alerts"
  ON public.stock_alerts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Store owners can view their alerts"
  ON public.stock_alerts FOR SELECT
  USING (
    affiliate_store_id IN (
      SELECT id FROM public.affiliate_stores 
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Store owners can manage their alerts"
  ON public.stock_alerts FOR UPDATE
  USING (
    affiliate_store_id IN (
      SELECT id FROM public.affiliate_stores 
      WHERE profile_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_stock_alerts_product ON public.stock_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_email ON public.stock_alerts(customer_email);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_store ON public.stock_alerts(affiliate_store_id);