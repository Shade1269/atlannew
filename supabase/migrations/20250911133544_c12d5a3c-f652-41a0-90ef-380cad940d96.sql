-- إنشاء trigger لإنشاء البروفايل تلقائياً عند إنشاء مستخدم جديد
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();