-- Fix the security definer view issue by recreating the view without security definer
DROP VIEW IF EXISTS public.channel_member_counts;

-- Create a simple view that counts members per channel (no security definer)
CREATE VIEW public.channel_member_counts AS
SELECT 
  channel_id,
  COUNT(*) as member_count
FROM public.channel_members
GROUP BY channel_id;

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.channel_member_counts TO authenticated;