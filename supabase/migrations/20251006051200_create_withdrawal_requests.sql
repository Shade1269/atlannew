CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_type TEXT NOT NULL CHECK (user_type IN ('affiliate', 'merchant')),
    amount_sar DECIMAL(10,2) NOT NULL CHECK (amount_sar > 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('bank_transfer', 'stc_pay', 'wallet')),
    bank_name TEXT,
    bank_account_name TEXT,
    bank_account_number TEXT,
    iban TEXT,
    phone_number TEXT,
    notes TEXT,
    admin_notes TEXT,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own withdrawal requests" ON public.withdrawal_requests
    FOR SELECT
    USING (user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can create own withdrawal requests" ON public.withdrawal_requests
    FOR INSERT
    WITH CHECK (user_id IN (SELECT id FROM profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Admins can view all withdrawal requests" ON public.withdrawal_requests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE auth_user_id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update withdrawal requests" ON public.withdrawal_requests
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE auth_user_id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE TRIGGER handle_withdrawal_requests_updated_at
    BEFORE UPDATE ON public.withdrawal_requests
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_withdrawal_requests_user_id ON public.withdrawal_requests(user_id);
CREATE INDEX idx_withdrawal_requests_status ON public.withdrawal_requests(status);
CREATE INDEX idx_withdrawal_requests_user_type ON public.withdrawal_requests(user_type);

CREATE TABLE IF NOT EXISTS public.platform_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read platform settings" ON public.platform_settings
    FOR SELECT
    USING (true);

CREATE POLICY "Admins can update platform settings" ON public.platform_settings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE auth_user_id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE TRIGGER handle_platform_settings_updated_at
    BEFORE UPDATE ON public.platform_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

INSERT INTO public.platform_settings (setting_key, setting_value, description)
VALUES (
    'platform_commission_rate',
    '{"rate": 25, "enabled": true}'::jsonb,
    'Platform commission rate percentage (default 25%)'
)
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO public.platform_settings (setting_key, setting_value, description)
VALUES (
    'minimum_withdrawal_amount',
    '{"amount": 100}'::jsonb,
    'Minimum amount in SAR that can be withdrawn'
)
ON CONFLICT (setting_key) DO NOTHING;
