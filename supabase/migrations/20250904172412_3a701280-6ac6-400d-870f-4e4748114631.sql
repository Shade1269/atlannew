-- Update Shade's role to admin so they can see all users
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'shade199633@icloud.com' OR full_name = 'Shade';