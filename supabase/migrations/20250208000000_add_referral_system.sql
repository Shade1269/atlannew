-- ============================================
-- Referral System Migration
-- نظام الإحالة للمسوقين
-- ============================================

-- Add referral_code and referred_by to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add referred_by to affiliate_stores table
ALTER TABLE public.affiliate_stores
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create referral_commissions table
CREATE TABLE IF NOT EXISTS public.referral_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    referred_store_id UUID REFERENCES public.affiliate_stores(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    order_item_id UUID REFERENCES public.order_items(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    commission_per_item DECIMAL(10,2) NOT NULL DEFAULT 2.00,
    total_commission DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, paid, cancelled
    confirmed_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referrer ON public.referral_commissions(referrer_profile_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_store ON public.referral_commissions(referred_store_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_order ON public.referral_commissions(order_id);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by);
CREATE INDEX IF NOT EXISTS idx_affiliate_stores_referred_by ON public.affiliate_stores(referred_by);

-- Create function to generate a unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = new_code) INTO code_exists;
    IF NOT code_exists THEN
      EXIT;
    END IF;
  END LOOP;
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Create function to auto-generate referral code for new affiliates
CREATE OR REPLACE FUNCTION auto_generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'affiliate' AND (NEW.referral_code IS NULL OR NEW.referral_code = '') THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate referral code
DROP TRIGGER IF EXISTS trigger_auto_generate_referral_code ON public.profiles;
CREATE TRIGGER trigger_auto_generate_referral_code
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (NEW.role = 'affiliate')
  EXECUTE FUNCTION auto_generate_referral_code();

-- Create function to calculate and create referral commission when order item is created
CREATE OR REPLACE FUNCTION create_referral_commission()
RETURNS TRIGGER AS $$
DECLARE
  v_referred_by UUID;
  v_referrer_profile_id UUID;
  v_commission_per_item DECIMAL(10,2) := 2.00; -- 2 SAR per item
  v_total_commission DECIMAL(10,2);
  v_affiliate_store_id UUID;
BEGIN
  -- Get the affiliate_store_id from the orders table using NEW.order_id
  SELECT affiliate_store_id INTO v_affiliate_store_id
  FROM public.orders
  WHERE id = NEW.order_id;

  -- If there's an affiliate store associated with the order, check if it was referred
  IF v_affiliate_store_id IS NOT NULL THEN
    SELECT referred_by INTO v_referred_by
    FROM public.affiliate_stores
    WHERE id = v_affiliate_store_id;
    
    -- If there's a referrer, create commission
    IF v_referred_by IS NOT NULL THEN
      v_referrer_profile_id := v_referred_by;
      
      -- Calculate total commission (2 SAR per item)
      v_total_commission := NEW.quantity * v_commission_per_item;
      
      -- Create referral commission record
      INSERT INTO public.referral_commissions (
        referrer_profile_id,
        referred_store_id,
        order_id,
        order_item_id,
        product_id,
        quantity,
        commission_per_item,
        total_commission,
        status,
        confirmed_at
      ) VALUES (
        v_referrer_profile_id,
        v_affiliate_store_id,
        NEW.order_id,
        NEW.id,
        NEW.product_id,
        NEW.quantity,
        v_commission_per_item,
        v_total_commission,
        'confirmed',
        NOW()
      );
      
      -- Update referrer's total_earnings
      UPDATE public.profiles
      SET total_earnings = COALESCE(total_earnings, 0) + v_total_commission
      WHERE id = v_referrer_profile_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to create referral commission when order item is created
DROP TRIGGER IF EXISTS trigger_create_referral_commission ON public.order_items;
CREATE TRIGGER trigger_create_referral_commission
  AFTER INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION create_referral_commission();

-- Create function to link affiliate store to referrer when store is created
CREATE OR REPLACE FUNCTION link_store_to_referrer()
RETURNS TRIGGER AS $$
DECLARE
  v_referred_by UUID;
BEGIN
  -- Get the referred_by from the profile that created the store
  IF NEW.profile_id IS NOT NULL THEN
    SELECT referred_by INTO v_referred_by
    FROM public.profiles 
    WHERE id = NEW.profile_id;

    IF v_referred_by IS NOT NULL THEN
      NEW.referred_by := v_referred_by;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to link affiliate store to referrer
DROP TRIGGER IF EXISTS trigger_link_store_to_referrer ON public.affiliate_stores;
CREATE TRIGGER trigger_link_store_to_referrer
  BEFORE INSERT ON public.affiliate_stores
  FOR EACH ROW
  EXECUTE FUNCTION link_store_to_referrer();
