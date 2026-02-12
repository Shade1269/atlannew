-- إضافة الدوال والتريجرز والسياسات الأمنية المفقودة

-- إنشاء دالة لتحديث المستوى مع تعيين search_path
CREATE OR REPLACE FUNCTION public.update_user_level()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- إنشاء trigger لتحديث المستوى إذا لم يكن موجوداً
DROP TRIGGER IF EXISTS update_user_level_trigger ON public.user_levels;
CREATE TRIGGER update_user_level_trigger
  BEFORE UPDATE ON public.user_levels
  FOR EACH ROW EXECUTE FUNCTION public.update_user_level();

-- إنشاء دالة لتحديث عداد أعضاء التحالف مع تعيين search_path
CREATE OR REPLACE FUNCTION public.update_alliance_member_count()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- إنشاء triggers لتحديث عداد الأعضاء إذا لم تكن موجودة
DROP TRIGGER IF EXISTS alliance_member_count_insert ON public.alliance_members;
DROP TRIGGER IF EXISTS alliance_member_count_delete ON public.alliance_members;

CREATE TRIGGER alliance_member_count_insert
  AFTER INSERT ON public.alliance_members
  FOR EACH ROW EXECUTE FUNCTION public.update_alliance_member_count();

CREATE TRIGGER alliance_member_count_delete
  AFTER DELETE ON public.alliance_members
  FOR EACH ROW EXECUTE FUNCTION public.update_alliance_member_count();

-- إنشاء دالة لتحديث إحصائيات التحالف مع تعيين search_path
CREATE OR REPLACE FUNCTION public.update_alliance_stats()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- إنشاء trigger لتحديث إحصائيات التحالف
DROP TRIGGER IF EXISTS update_alliance_stats_trigger ON public.alliance_members;
CREATE TRIGGER update_alliance_stats_trigger
  AFTER UPDATE OF contribution_points ON public.alliance_members
  FOR EACH ROW EXECUTE FUNCTION public.update_alliance_stats();

-- إنشاء دالة لحساب ترتيب الأسبوع مع تعيين search_path
CREATE OR REPLACE FUNCTION public.calculate_weekly_rankings()
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- تمكين RLS على جميع الجداول الجديدة
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alliances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alliance_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.castle_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alliance_weekly_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alliance_reports ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان - مستويات المسوقين
DROP POLICY IF EXISTS "Users can view all levels" ON public.user_levels;
DROP POLICY IF EXISTS "Users can update own level" ON public.user_levels;
DROP POLICY IF EXISTS "System can manage levels" ON public.user_levels;

CREATE POLICY "Users can view all levels" ON public.user_levels FOR SELECT USING (true);
CREATE POLICY "Users can update own level" ON public.user_levels FOR UPDATE USING (
  user_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_user_id = auth.uid())
);
CREATE POLICY "System can manage levels" ON public.user_levels FOR ALL USING (
  get_current_user_role() = 'admin' OR auth.jwt()->>'role' = 'service_role'
);

-- سياسات الأمان - التحالفات
DROP POLICY IF EXISTS "Users can view active alliances" ON public.alliances;
DROP POLICY IF EXISTS "Leaders can manage their alliance" ON public.alliances;
DROP POLICY IF EXISTS "Affiliates can create alliances" ON public.alliances;
DROP POLICY IF EXISTS "Admins can manage all alliances" ON public.alliances;

CREATE POLICY "Users can view active alliances" ON public.alliances FOR SELECT USING (status = 'active');
CREATE POLICY "Leaders can manage their alliance" ON public.alliances FOR UPDATE USING (
  leader_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_user_id = auth.uid())
);
CREATE POLICY "Affiliates can create alliances" ON public.alliances FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_levels ul 
    JOIN profiles p ON p.id = ul.user_id 
    WHERE p.auth_user_id = auth.uid() 
    AND ul.current_level IN ('silver', 'gold', 'legendary')
  )
);
CREATE POLICY "Admins can manage all alliances" ON public.alliances FOR ALL USING (
  get_current_user_role() = 'admin'
);

-- سياسات الأمان - أعضاء التحالفات
DROP POLICY IF EXISTS "Users can view alliance members" ON public.alliance_members;
DROP POLICY IF EXISTS "Users can join/leave alliances" ON public.alliance_members;

CREATE POLICY "Users can view alliance members" ON public.alliance_members FOR SELECT USING (true);
CREATE POLICY "Users can join/leave alliances" ON public.alliance_members FOR ALL USING (
  user_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_user_id = auth.uid()) OR
  alliance_id IN (SELECT id FROM alliances WHERE leader_id IN (
    SELECT profiles.id FROM profiles WHERE profiles.auth_user_id = auth.uid()
  )) OR
  get_current_user_role() = 'admin'
);

-- سياسات الأمان - التحديات
DROP POLICY IF EXISTS "Users can view challenges" ON public.weekly_challenges;
DROP POLICY IF EXISTS "Admins can manage challenges" ON public.weekly_challenges;

CREATE POLICY "Users can view challenges" ON public.weekly_challenges FOR SELECT USING (true);
CREATE POLICY "Admins can manage challenges" ON public.weekly_challenges FOR ALL USING (
  get_current_user_role() = 'admin'
);

-- سياسات الأمان - مشاركة التحديات
DROP POLICY IF EXISTS "Users can view challenge participations" ON public.challenge_participations;
DROP POLICY IF EXISTS "Alliance leaders can manage participations" ON public.challenge_participations;

CREATE POLICY "Users can view challenge participations" ON public.challenge_participations FOR SELECT USING (true);
CREATE POLICY "Alliance leaders can manage participations" ON public.challenge_participations FOR ALL USING (
  alliance_id IN (SELECT id FROM alliances WHERE leader_id IN (
    SELECT profiles.id FROM profiles WHERE profiles.auth_user_id = auth.uid()
  )) OR
  get_current_user_role() = 'admin'
);

-- سياسات الأمان - سيطرة القلعة
DROP POLICY IF EXISTS "Users can view castle control" ON public.castle_control;
DROP POLICY IF EXISTS "System can manage castle control" ON public.castle_control;

CREATE POLICY "Users can view castle control" ON public.castle_control FOR SELECT USING (true);
CREATE POLICY "System can manage castle control" ON public.castle_control FOR ALL USING (
  get_current_user_role() = 'admin' OR auth.jwt()->>'role' = 'service_role'
);

-- سياسات الأمان - الترتيب الأسبوعي
DROP POLICY IF EXISTS "Users can view weekly leaderboard" ON public.weekly_leaderboard;
DROP POLICY IF EXISTS "System can manage weekly leaderboard" ON public.weekly_leaderboard;

CREATE POLICY "Users can view weekly leaderboard" ON public.weekly_leaderboard FOR SELECT USING (true);
CREATE POLICY "System can manage weekly leaderboard" ON public.weekly_leaderboard FOR ALL USING (
  get_current_user_role() = 'admin' OR auth.jwt()->>'role' = 'service_role'
);

-- سياسات الأمان - الترتيب الشهري
DROP POLICY IF EXISTS "Users can view monthly leaderboard" ON public.monthly_leaderboard;
DROP POLICY IF EXISTS "System can manage monthly leaderboard" ON public.monthly_leaderboard;

CREATE POLICY "Users can view monthly leaderboard" ON public.monthly_leaderboard FOR SELECT USING (true);
CREATE POLICY "System can manage monthly leaderboard" ON public.monthly_leaderboard FOR ALL USING (
  get_current_user_role() = 'admin' OR auth.jwt()->>'role' = 'service_role'
);

-- سياسات الأمان - ترتيب التحالفات
DROP POLICY IF EXISTS "Users can view alliance leaderboard" ON public.alliance_weekly_leaderboard;
DROP POLICY IF EXISTS "System can manage alliance leaderboard" ON public.alliance_weekly_leaderboard;

CREATE POLICY "Users can view alliance leaderboard" ON public.alliance_weekly_leaderboard FOR SELECT USING (true);
CREATE POLICY "System can manage alliance leaderboard" ON public.alliance_weekly_leaderboard FOR ALL USING (
  get_current_user_role() = 'admin' OR auth.jwt()->>'role' = 'service_role'
);

-- سياسات الأمان - الثيمات
DROP POLICY IF EXISTS "Users can view own themes" ON public.user_themes;
DROP POLICY IF EXISTS "System can manage themes" ON public.user_themes;

CREATE POLICY "Users can view own themes" ON public.user_themes FOR SELECT USING (
  user_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_user_id = auth.uid())
);
CREATE POLICY "System can manage themes" ON public.user_themes FOR ALL USING (
  get_current_user_role() = 'admin' OR auth.jwt()->>'role' = 'service_role'
);

-- سياسات الأمان - التقارير
DROP POLICY IF EXISTS "Users can create reports" ON public.alliance_reports;
DROP POLICY IF EXISTS "Admins can manage reports" ON public.alliance_reports;
DROP POLICY IF EXISTS "Users can view own reports" ON public.alliance_reports;

CREATE POLICY "Users can create reports" ON public.alliance_reports FOR INSERT WITH CHECK (
  reporter_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_user_id = auth.uid())
);
CREATE POLICY "Admins can manage reports" ON public.alliance_reports FOR ALL USING (
  get_current_user_role() = 'admin'
);
CREATE POLICY "Users can view own reports" ON public.alliance_reports FOR SELECT USING (
  reporter_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_user_id = auth.uid()) OR
  get_current_user_role() = 'admin'
);