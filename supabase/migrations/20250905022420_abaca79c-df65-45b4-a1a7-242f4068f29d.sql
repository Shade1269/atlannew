-- Check current policies for shops table and fix RLS issues
SELECT policyname, cmd, permissive, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'shops' AND schemaname = 'public';