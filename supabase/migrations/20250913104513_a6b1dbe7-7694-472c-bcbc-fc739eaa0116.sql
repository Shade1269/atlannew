-- إدراج دور affiliate للمستخدم الحالي في جدول user_roles
INSERT INTO user_roles (user_id, role) 
VALUES ('e843008c-35b5-4c15-acd5-bc4c721117c6', 'affiliate')
ON CONFLICT (user_id, role) DO NOTHING;