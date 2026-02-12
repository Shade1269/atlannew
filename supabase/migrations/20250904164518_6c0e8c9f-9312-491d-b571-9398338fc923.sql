-- Final security cleanup migration

-- 1. Drop the channel_member_counts view since it's flagged as publicly readable
DROP VIEW IF EXISTS public.channel_member_counts CASCADE;

-- 2. Create a secure function to get member counts that respects RLS
CREATE OR REPLACE FUNCTION public.get_channel_member_count(channel_uuid UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Only return count if the requesting user is a member of the channel
  SELECT CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM channel_members cm 
      JOIN profiles p ON p.id = cm.user_id 
      WHERE cm.channel_id = channel_uuid 
      AND p.auth_user_id = auth.uid()
    ) THEN (
      SELECT COUNT(*)::INTEGER 
      FROM channel_members 
      WHERE channel_id = channel_uuid
    )
    ELSE NULL
  END;
$$;

-- 3. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_channel_member_count(UUID) TO authenticated;

-- 4. Check for and remove any other problematic views or functions
-- Look for any remaining security definer views in other schemas that might be accessible
DO $$
DECLARE
    rec RECORD;
BEGIN
    -- Find any views with security definer in any accessible schema
    FOR rec IN 
        SELECT schemaname, viewname 
        FROM pg_views 
        WHERE schemaname IN ('public', 'auth', 'storage') 
        AND definition ILIKE '%security definer%'
    LOOP
        -- Only drop views from public schema for safety
        IF rec.schemaname = 'public' THEN
            EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', rec.schemaname, rec.viewname);
            RAISE NOTICE 'Dropped security definer view: %.%', rec.schemaname, rec.viewname;
        ELSE
            RAISE NOTICE 'Found security definer view in protected schema: %.%', rec.schemaname, rec.viewname;
        END IF;
    END LOOP;
END $$;