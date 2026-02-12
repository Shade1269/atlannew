-- ============================================
-- منح Permissions على referral functions
-- Grant Permissions on referral functions
-- ============================================

-- منح permissions على function للبحث عن referral_code
-- Allow anonymous users to lookup referral codes
GRANT EXECUTE ON FUNCTION public.get_referrer_by_code(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_referrer_by_code(text) TO authenticated;

-- منح permissions على function لإنشاء/تحديث profile
-- Allow authenticated users to create/update profiles
GRANT EXECUTE ON FUNCTION public.create_or_update_profile(uuid, text, text, user_role, uuid) TO authenticated;

