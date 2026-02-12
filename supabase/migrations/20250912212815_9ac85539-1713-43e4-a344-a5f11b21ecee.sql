-- إصلاح مشاكل الأمان للوظائف المنشأة حديثاً
-- إضافة SET search_path للدوال المنشأة

CREATE OR REPLACE FUNCTION public.update_user_level()
RETURNS TRIGGER AS $$
DECLARE
  new_level user_level;
  new_threshold INTEGER;
BEGIN
  -- تحديد المستوى الجديد بناءً على النقاط
  IF NEW.total_points >= 5000 THEN
    new_level := 'legendary';
    new_threshold := 5000;
  ELSIF NEW.total_points >= 2000 THEN
    new_level := 'gold';
    new_threshold := 5000;
  ELSIF NEW.total_points >= 500 THEN
    new_level := 'silver';
    new_threshold := 2000;
  ELSE
    new_level := 'bronze';
    new_threshold := 500;
  END IF;
  
  -- تحديث المستوى إذا تغير
  IF NEW.current_level != new_level THEN
    NEW.current_level := new_level;
    NEW.level_achieved_at := now();
    NEW.next_level_threshold := new_threshold;
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_alliance_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.alliances 
    SET member_count = member_count + 1, updated_at = now()
    WHERE id = NEW.alliance_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.alliances 
    SET member_count = member_count - 1, updated_at = now()
    WHERE id = OLD.alliance_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_alliance_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- تحديث نقاط التحالف الإجمالية
  UPDATE public.alliances 
  SET 
    total_points = (
      SELECT COALESCE(SUM(contribution_points), 0) 
      FROM public.alliance_members 
      WHERE alliance_id = NEW.alliance_id AND is_active = true
    ),
    updated_at = now()
  WHERE id = NEW.alliance_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- إضافة دالة جديدة لحساب الترتيب الأسبوعي
CREATE OR REPLACE FUNCTION public.calculate_weekly_rankings()
RETURNS void AS $$
DECLARE
  current_week INTEGER;
  current_year INTEGER;
BEGIN
  -- الحصول على رقم الأسبوع والسنة الحالية
  current_week := EXTRACT(WEEK FROM now());
  current_year := EXTRACT(YEAR FROM now());
  
  -- حساب ترتيب الأفراد
  WITH ranked_users AS (
    SELECT 
      user_id,
      points,
      ROW_NUMBER() OVER (ORDER BY points DESC, sales_amount DESC) as new_rank
    FROM public.weekly_leaderboard
    WHERE week_number = current_week AND year_number = current_year
  )
  UPDATE public.weekly_leaderboard 
  SET rank = ranked_users.new_rank, updated_at = now()
  FROM ranked_users
  WHERE weekly_leaderboard.user_id = ranked_users.user_id
    AND weekly_leaderboard.week_number = current_week 
    AND weekly_leaderboard.year_number = current_year;
    
  -- حساب ترتيب التحالفات
  WITH ranked_alliances AS (
    SELECT 
      alliance_id,
      total_points,
      ROW_NUMBER() OVER (ORDER BY total_points DESC, total_sales DESC) as new_rank
    FROM public.alliance_weekly_leaderboard
    WHERE week_number = current_week AND year_number = current_year
  )
  UPDATE public.alliance_weekly_leaderboard 
  SET rank = ranked_alliances.new_rank, updated_at = now()
  FROM ranked_alliances
  WHERE alliance_weekly_leaderboard.alliance_id = ranked_alliances.alliance_id
    AND alliance_weekly_leaderboard.week_number = current_week 
    AND alliance_weekly_leaderboard.year_number = current_year;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;