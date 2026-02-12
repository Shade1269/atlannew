-- Create enums safely
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'theme_type') THEN
        CREATE TYPE theme_type AS ENUM ('classic', 'feminine', 'damascus');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_level') THEN
        CREATE TYPE user_level AS ENUM ('bronze', 'silver', 'gold', 'legendary');
    END IF;
END
$$;