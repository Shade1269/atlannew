-- التحقق من وجود الenums وإنشاء المفقود منها فقط
DO $$ 
BEGIN
    -- إنشاء alliance_status enum إذا لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alliance_status') THEN
        CREATE TYPE alliance_status AS ENUM ('active', 'inactive', 'disbanded');
    END IF;
    
    -- إنشاء challenge_status enum إذا لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'challenge_status') THEN
        CREATE TYPE challenge_status AS ENUM ('upcoming', 'active', 'completed', 'cancelled');
    END IF;
    
    -- إنشاء challenge_type enum إذا لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'challenge_type') THEN
        CREATE TYPE challenge_type AS ENUM ('sales', 'customers', 'points', 'mixed');
    END IF;
END $$;

-- جدول مستويات المسوقين (تحديث جدول profiles بدلاً من إنشاء جدول جديد)
-- إضافة أعمدة جديدة لجدول profiles الموجود
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS current_level user_level DEFAULT 'bronze',
ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS next_level_threshold INTEGER DEFAULT 500,
ADD COLUMN IF NOT EXISTS level_achieved_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- إنشاء فهارس للأداء على profiles
CREATE INDEX IF NOT EXISTS idx_profiles_level ON public.profiles(current_level);
CREATE INDEX IF NOT EXISTS idx_profiles_points ON public.profiles(total_points DESC);

-- جدول التحالفات
CREATE TABLE IF NOT EXISTS public.alliances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  leader_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status alliance_status NOT NULL DEFAULT 'active',
  member_count INTEGER NOT NULL DEFAULT 1,
  max_members INTEGER NOT NULL DEFAULT 20,
  total_points INTEGER NOT NULL DEFAULT 0,
  total_sales NUMERIC NOT NULL DEFAULT 0,
  theme theme_type NOT NULL DEFAULT 'classic',
  castle_controlled_at TIMESTAMP WITH TIME ZONE,
  castle_control_duration INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_name_change TIMESTAMP WITH TIME ZONE,
  last_logo_change TIMESTAMP WITH TIME ZONE
);

-- فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_alliances_leader_id ON public.alliances(leader_id);
CREATE INDEX IF NOT EXISTS idx_alliances_status ON public.alliances(status);
CREATE INDEX IF NOT EXISTS idx_alliances_points ON public.alliances(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_alliances_name ON public.alliances(name);

-- جدول أعضاء التحالفات
CREATE TABLE IF NOT EXISTS public.alliance_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alliance_id UUID NOT NULL REFERENCES public.alliances(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  contribution_points INTEGER NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(alliance_id, user_id)
);

-- فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_alliance_members_alliance_id ON public.alliance_members(alliance_id);
CREATE INDEX IF NOT EXISTS idx_alliance_members_user_id ON public.alliance_members(user_id);
CREATE INDEX IF NOT EXISTS idx_alliance_members_contribution ON public.alliance_members(contribution_points DESC);

-- جدول التحديات الأسبوعية
CREATE TABLE IF NOT EXISTS public.weekly_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type challenge_type NOT NULL,
  target_value INTEGER NOT NULL,
  difficulty_level TEXT NOT NULL DEFAULT 'normal',
  bonus_points INTEGER NOT NULL DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status challenge_status NOT NULL DEFAULT 'upcoming',
  winner_alliance_id UUID REFERENCES public.alliances(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_weekly_challenges_dates ON public.weekly_challenges(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_weekly_challenges_status ON public.weekly_challenges(status);
CREATE INDEX IF NOT EXISTS idx_weekly_challenges_type ON public.weekly_challenges(challenge_type);

-- جدول مشاركة التحالفات في التحديات
CREATE TABLE IF NOT EXISTS public.challenge_participations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.weekly_challenges(id) ON DELETE CASCADE,
  alliance_id UUID NOT NULL REFERENCES public.alliances(id) ON DELETE CASCADE,
  current_progress INTEGER NOT NULL DEFAULT 0,
  final_score INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE,
  bonus_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, alliance_id)
);

-- فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_challenge_participations_challenge ON public.challenge_participations(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participations_alliance ON public.challenge_participations(alliance_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participations_rank ON public.challenge_participations(rank);

-- جدول سيطرة القلعة
CREATE TABLE IF NOT EXISTS public.castle_control (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alliance_id UUID NOT NULL REFERENCES public.alliances(id) ON DELETE CASCADE,
  controlled_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  controlled_until TIMESTAMP WITH TIME ZONE NOT NULL,
  week_number INTEGER NOT NULL,
  year_number INTEGER NOT NULL,
  points_earned INTEGER NOT NULL DEFAULT 0,
  challenge_won TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_current BOOLEAN NOT NULL DEFAULT true
);

-- فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_castle_control_current ON public.castle_control(is_current, controlled_until);
CREATE INDEX IF NOT EXISTS idx_castle_control_alliance ON public.castle_control(alliance_id);
CREATE INDEX IF NOT EXISTS idx_castle_control_week ON public.castle_control(week_number, year_number);

-- جدول الترتيب الأسبوعي للأفراد
CREATE TABLE IF NOT EXISTS public.weekly_leaderboard (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  year_number INTEGER NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  sales_amount NUMERIC NOT NULL DEFAULT 0,
  orders_count INTEGER NOT NULL DEFAULT 0,
  customers_count INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  rank_change INTEGER DEFAULT 0,
  theme_earned theme_type,
  bonus_earned NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_number, year_number)
);

-- فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_weekly_leaderboard_week ON public.weekly_leaderboard(week_number, year_number);
CREATE INDEX IF NOT EXISTS idx_weekly_leaderboard_rank ON public.weekly_leaderboard(week_number, year_number, rank);
CREATE INDEX IF NOT EXISTS idx_weekly_leaderboard_user ON public.weekly_leaderboard(user_id);

-- جدول الترتيب الشهري للأفراد
CREATE TABLE IF NOT EXISTS public.monthly_leaderboard (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month_number INTEGER NOT NULL,
  year_number INTEGER NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  sales_amount NUMERIC NOT NULL DEFAULT 0,
  orders_count INTEGER NOT NULL DEFAULT 0,
  customers_count INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  rank_change INTEGER DEFAULT 0,
  rewards_earned JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, month_number, year_number)
);

-- فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_monthly_leaderboard_month ON public.monthly_leaderboard(month_number, year_number);
CREATE INDEX IF NOT EXISTS idx_monthly_leaderboard_rank ON public.monthly_leaderboard(month_number, year_number, rank);
CREATE INDEX IF NOT EXISTS idx_monthly_leaderboard_user ON public.monthly_leaderboard(user_id);

-- جدول ترتيب التحالفات الأسبوعي
CREATE TABLE IF NOT EXISTS public.alliance_weekly_leaderboard (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alliance_id UUID NOT NULL REFERENCES public.alliances(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  year_number INTEGER NOT NULL,
  total_points INTEGER NOT NULL DEFAULT 0,
  total_sales NUMERIC NOT NULL DEFAULT 0,
  total_orders INTEGER NOT NULL DEFAULT 0,
  active_members INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  rank_change INTEGER DEFAULT 0,
  castle_controlled BOOLEAN DEFAULT false,
  rewards_earned JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(alliance_id, week_number, year_number)
);

-- فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_alliance_weekly_leaderboard_week ON public.alliance_weekly_leaderboard(week_number, year_number);
CREATE INDEX IF NOT EXISTS idx_alliance_weekly_leaderboard_rank ON public.alliance_weekly_leaderboard(week_number, year_number, rank);
CREATE INDEX IF NOT EXISTS idx_alliance_weekly_leaderboard_alliance ON public.alliance_weekly_leaderboard(alliance_id);

-- جدول الثيمات والمكافآت
CREATE TABLE IF NOT EXISTS public.user_themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  theme_type theme_type NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  earned_reason TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_user_themes_user_id ON public.user_themes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_themes_active ON public.user_themes(user_id, is_active);

-- جدول التقارير والمخالفات
CREATE TABLE IF NOT EXISTS public.alliance_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_alliance_id UUID NOT NULL REFERENCES public.alliances(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  action_taken TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_alliance_reports_status ON public.alliance_reports(status);
CREATE INDEX IF NOT EXISTS idx_alliance_reports_alliance ON public.alliance_reports(reported_alliance_id);

-- إنشاء دالة لتحديث المستوى في جدول profiles
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
$$ LANGUAGE plpgsql;

-- إنشاء trigger لتحديث المستوى
DROP TRIGGER IF EXISTS update_user_level_trigger ON public.profiles;
CREATE TRIGGER update_user_level_trigger
  BEFORE UPDATE OF total_points ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_user_level();

-- إنشاء دالة لتحديث عداد أعضاء التحالف
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
$$ LANGUAGE plpgsql;

-- إنشاء triggers لتحديث عداد الأعضاء
DROP TRIGGER IF EXISTS alliance_member_count_insert ON public.alliance_members;
DROP TRIGGER IF EXISTS alliance_member_count_delete ON public.alliance_members;

CREATE TRIGGER alliance_member_count_insert
  AFTER INSERT ON public.alliance_members
  FOR EACH ROW EXECUTE FUNCTION public.update_alliance_member_count();

CREATE TRIGGER alliance_member_count_delete
  AFTER DELETE ON public.alliance_members
  FOR EACH ROW EXECUTE FUNCTION public.update_alliance_member_count();

-- إنشاء دالة لتحديث إحصائيات التحالف
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
$$ LANGUAGE plpgsql;

-- إنشاء trigger لتحديث إحصائيات التحالف
DROP TRIGGER IF EXISTS update_alliance_stats_trigger ON public.alliance_members;
CREATE TRIGGER update_alliance_stats_trigger
  AFTER UPDATE OF contribution_points ON public.alliance_members
  FOR EACH ROW EXECUTE FUNCTION public.update_alliance_stats();

-- تمكين RLS على الجداول الجديدة
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

-- سياسات الأمان - التحالفات
CREATE POLICY "Users can view active alliances" ON public.alliances FOR SELECT USING (status = 'active');
CREATE POLICY "Leaders can manage their alliance" ON public.alliances FOR UPDATE USING (
  leader_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
);
CREATE POLICY "Affiliates can create alliances" ON public.alliances FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.auth_user_id = auth.uid() 
    AND p.current_level IN ('silver', 'gold', 'legendary')
    AND p.id = leader_id
  )
);
CREATE POLICY "Admins can manage all alliances" ON public.alliances FOR ALL USING (
  get_current_user_role() = 'admin'
);

-- سياسات الأمان - أعضاء التحالفات
CREATE POLICY "Users can view alliance members" ON public.alliance_members FOR SELECT USING (true);
CREATE POLICY "Users can join/leave alliances" ON public.alliance_members FOR ALL USING (
  user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()) OR
  alliance_id IN (SELECT id FROM alliances WHERE leader_id = (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()
  )) OR
  get_current_user_role() = 'admin'
);

-- سياسات الأمان - التحديات
CREATE POLICY "Users can view challenges" ON public.weekly_challenges FOR SELECT USING (true);
CREATE POLICY "Admins can manage challenges" ON public.weekly_challenges FOR ALL USING (
  get_current_user_role() = 'admin'
);

-- سياسات الأمان - مشاركة التحديات
CREATE POLICY "Users can view challenge participations" ON public.challenge_participations FOR SELECT USING (true);
CREATE POLICY "Alliance leaders can manage participations" ON public.challenge_participations FOR ALL USING (
  alliance_id IN (SELECT id FROM alliances WHERE leader_id = (
    SELECT id FROM profiles WHERE auth_user_id = auth.uid()
  )) OR
  get_current_user_role() = 'admin'
);

-- سياسات الأمان - سيطرة القلعة
CREATE POLICY "Users can view castle control" ON public.castle_control FOR SELECT USING (true);
CREATE POLICY "System can manage castle control" ON public.castle_control FOR ALL USING (
  get_current_user_role() = 'admin' OR auth.jwt()->>'role' = 'service_role'
);

-- سياسات الأمان - الترتيب الأسبوعي
CREATE POLICY "Users can view weekly leaderboard" ON public.weekly_leaderboard FOR SELECT USING (true);
CREATE POLICY "System can manage weekly leaderboard" ON public.weekly_leaderboard FOR ALL USING (
  get_current_user_role() = 'admin' OR auth.jwt()->>'role' = 'service_role'
);

-- سياسات الأمان - الترتيب الشهري
CREATE POLICY "Users can view monthly leaderboard" ON public.monthly_leaderboard FOR SELECT USING (true);
CREATE POLICY "System can manage monthly leaderboard" ON public.monthly_leaderboard FOR ALL USING (
  get_current_user_role() = 'admin' OR auth.jwt()->>'role' = 'service_role'
);

-- سياسات الأمان - ترتيب التحالفات
CREATE POLICY "Users can view alliance leaderboard" ON public.alliance_weekly_leaderboard FOR SELECT USING (true);
CREATE POLICY "System can manage alliance leaderboard" ON public.alliance_weekly_leaderboard FOR ALL USING (
  get_current_user_role() = 'admin' OR auth.jwt()->>'role' = 'service_role'
);

-- سياسات الأمان - الثيمات
CREATE POLICY "Users can view own themes" ON public.user_themes FOR SELECT USING (
  user_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
);
CREATE POLICY "System can manage themes" ON public.user_themes FOR ALL USING (
  get_current_user_role() = 'admin' OR auth.jwt()->>'role' = 'service_role'
);

-- سياسات الأمان - التقارير
CREATE POLICY "Users can create reports" ON public.alliance_reports FOR INSERT WITH CHECK (
  reporter_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid())
);
CREATE POLICY "Admins can manage reports" ON public.alliance_reports FOR ALL USING (
  get_current_user_role() = 'admin'
);
CREATE POLICY "Users can view own reports" ON public.alliance_reports FOR SELECT USING (
  reporter_id = (SELECT id FROM profiles WHERE auth_user_id = auth.uid()) OR
  get_current_user_role() = 'admin'
);