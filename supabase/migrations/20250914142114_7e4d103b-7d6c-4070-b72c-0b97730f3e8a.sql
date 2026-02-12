-- إصلاح مشكلة Extension in Public - نقل الامتدادات من public إلى extensions schema

-- إنشاء مخطط extensions إذا لم يكن موجوداً
CREATE SCHEMA IF NOT EXISTS extensions;

-- نقل امتدادات شائعة من public إلى extensions
-- التحقق من وجود الامتدادات أولاً ثم نقلها
DO $$
DECLARE
    ext_name text;
    ext_names text[] := ARRAY['uuid-ossp', 'pgcrypto', 'pg_stat_statements', 'pg_trgm', 'btree_gin', 'btree_gist'];
BEGIN
    FOREACH ext_name IN ARRAY ext_names
    LOOP
        -- التحقق من وجود الامتداد في public
        IF EXISTS (
            SELECT 1 FROM pg_extension e 
            JOIN pg_namespace n ON n.oid = e.extnamespace 
            WHERE e.extname = ext_name AND n.nspname = 'public'
        ) THEN
            -- نقل الامتداد إلى extensions schema
            EXECUTE format('ALTER EXTENSION %I SET SCHEMA extensions', ext_name);
        END IF;
    END LOOP;
END
$$;

-- التأكد من أن امتداد uuid-ossp متاح في extensions schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;

-- إنشاء وظائف wrapper في public للوصول للامتدادات
CREATE OR REPLACE FUNCTION public.gen_random_uuid()
RETURNS uuid
LANGUAGE sql
VOLATILE
AS $$
  SELECT extensions.gen_random_uuid();
$$;