-- Check and create missing types and tables
DO $$ 
BEGIN
    -- Create order status enum if not exists
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned');
    END IF;

    -- Create theme enum if not exists
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'theme_type') THEN
        CREATE TYPE theme_type AS ENUM ('classic', 'feminine', 'damascus');
    END IF;

    -- Create level enum if not exists
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_level') THEN
        CREATE TYPE user_level AS ENUM ('bronze', 'silver', 'gold', 'legendary');
    END IF;
END $$;

-- Drop existing user_profiles table if exists and recreate
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Create new user_profiles table
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'affiliate',
    level user_level NOT NULL DEFAULT 'bronze',
    points INTEGER NOT NULL DEFAULT 0,
    total_earnings DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(auth_user_id),
    UNIQUE(email),
    UNIQUE(phone)
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create basic policies for user_profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Anyone can create profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = auth_user_id);