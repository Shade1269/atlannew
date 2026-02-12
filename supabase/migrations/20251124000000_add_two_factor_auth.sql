-- Enable Two-Factor Authentication (2FA) Support
-- This migration adds support for TOTP-based 2FA for enhanced security

-- Table: two_factor_auth
-- Stores 2FA secrets and configuration for users
CREATE TABLE IF NOT EXISTS public.two_factor_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- TOTP Secret (Base32 encoded)
  secret TEXT NOT NULL,

  -- 2FA Status
  enabled BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,

  -- Method: 'totp' (Google Authenticator, etc.) or 'sms' (future)
  method TEXT DEFAULT 'totp' CHECK (method IN ('totp', 'sms')),

  -- Backup/Recovery codes (hashed)
  backup_codes TEXT[], -- Array of hashed backup codes

  -- Metadata
  enabled_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE(user_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_two_factor_auth_user_id
ON public.two_factor_auth(user_id);

CREATE INDEX IF NOT EXISTS idx_two_factor_auth_enabled
ON public.two_factor_auth(user_id)
WHERE enabled = true;

-- Table: two_factor_auth_attempts
-- Track failed 2FA attempts for security monitoring
CREATE TABLE IF NOT EXISTS public.two_factor_auth_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Attempt details
  success BOOLEAN NOT NULL,
  method TEXT NOT NULL, -- 'totp' or 'backup_code'

  -- Security tracking
  ip_address TEXT,
  user_agent TEXT,

  -- Timestamp
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Index on user_id and timestamp for quick lookups
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_two_factor_auth_attempts_user_id
ON public.two_factor_auth_attempts(user_id, attempted_at DESC);

CREATE INDEX IF NOT EXISTS idx_two_factor_auth_attempts_failed
ON public.two_factor_auth_attempts(user_id, attempted_at DESC)
WHERE success = false;

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_two_factor_auth_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at
CREATE TRIGGER trigger_update_two_factor_auth_updated_at
BEFORE UPDATE ON public.two_factor_auth
FOR EACH ROW
EXECUTE FUNCTION public.update_two_factor_auth_updated_at();

-- RLS Policies
ALTER TABLE public.two_factor_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.two_factor_auth_attempts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own 2FA settings
CREATE POLICY "Users can view their own 2FA settings"
ON public.two_factor_auth
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own 2FA settings
CREATE POLICY "Users can insert their own 2FA settings"
ON public.two_factor_auth
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own 2FA settings
CREATE POLICY "Users can update their own 2FA settings"
ON public.two_factor_auth
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own 2FA settings
CREATE POLICY "Users can delete their own 2FA settings"
ON public.two_factor_auth
FOR DELETE
USING (auth.uid() = user_id);

-- Policy: Users can view their own 2FA attempts
CREATE POLICY "Users can view their own 2FA attempts"
ON public.two_factor_auth_attempts
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Service role can insert 2FA attempts (for Edge Functions)
CREATE POLICY "Service can insert 2FA attempts"
ON public.two_factor_auth_attempts
FOR INSERT
WITH CHECK (true);

-- Add 2FA enforcement to user_profiles (optional flag per user)
-- This allows admins to be required to use 2FA
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS require_2fa BOOLEAN DEFAULT false;

-- Add comment
COMMENT ON COLUMN public.user_profiles.require_2fa IS
'If true, this user must enable 2FA to access the platform';

-- Function: Check if user needs 2FA enforcement
-- This can be called during login to check if user should be forced to setup 2FA
CREATE OR REPLACE FUNCTION public.check_2fa_required(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
  v_require_2fa BOOLEAN;
  v_has_2fa BOOLEAN;
BEGIN
  -- Get user role and 2FA requirement
  SELECT role, require_2fa
  INTO v_role, v_require_2fa
  FROM public.user_profiles
  WHERE id = p_user_id;

  -- Check if user has 2FA enabled
  SELECT enabled
  INTO v_has_2fa
  FROM public.two_factor_auth
  WHERE user_id = p_user_id;

  -- Admin users must have 2FA
  IF v_role = 'admin' THEN
    RETURN COALESCE(v_has_2fa, false);
  END IF;

  -- If user has require_2fa flag, they must have it enabled
  IF v_require_2fa = true THEN
    RETURN COALESCE(v_has_2fa, false);
  END IF;

  -- Otherwise, 2FA is optional
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.two_factor_auth TO authenticated;
GRANT SELECT, INSERT ON public.two_factor_auth_attempts TO authenticated;

-- Comments for documentation
COMMENT ON TABLE public.two_factor_auth IS
'Stores TOTP secrets and 2FA configuration for users';

COMMENT ON TABLE public.two_factor_auth_attempts IS
'Logs all 2FA verification attempts for security monitoring';

COMMENT ON COLUMN public.two_factor_auth.secret IS
'Base32-encoded TOTP secret key (keep encrypted at rest)';

COMMENT ON COLUMN public.two_factor_auth.backup_codes IS
'Array of hashed backup/recovery codes for account recovery';
