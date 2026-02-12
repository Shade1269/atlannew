-- Create enums first
CREATE TYPE theme_type AS ENUM ('classic', 'feminine', 'damascus');
CREATE TYPE user_level AS ENUM ('bronze', 'silver', 'gold', 'legendary');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned');