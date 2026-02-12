-- إنشاء الأنواع المفقودة فقط
DO $$ 
BEGIN
  -- إنشاء نوع البيانات لحالة التحالف إذا لم يكن موجوداً
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alliance_status') THEN
    CREATE TYPE alliance_status AS ENUM ('active', 'inactive', 'disbanded');
  END IF;
  
  -- إنشاء نوع البيانات لحالة التحدي إذا لم يكن موجوداً
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'challenge_status') THEN
    CREATE TYPE challenge_status AS ENUM ('upcoming', 'active', 'completed', 'cancelled');
  END IF;
  
  -- إنشاء نوع البيانات لنوع التحدي إذا لم يكن موجوداً
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'challenge_type') THEN
    CREATE TYPE challenge_type AS ENUM ('sales', 'customers', 'points', 'mixed');
  END IF;
END $$;

-- تحديث theme_type لإضافة القيم الجديدة
ALTER TYPE theme_type ADD VALUE IF NOT EXISTS 'modern';
ALTER TYPE theme_type ADD VALUE IF NOT EXISTS 'elegant';
ALTER TYPE theme_type ADD VALUE IF NOT EXISTS 'gold';
ALTER TYPE theme_type ADD VALUE IF NOT EXISTS 'alliance_special';
ALTER TYPE theme_type ADD VALUE IF NOT EXISTS 'legendary';

-- التحقق من وجود جدول user_levels، إنشاؤه إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.user_levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  current_level user_level NOT NULL DEFAULT 'bronze',
  total_points INTEGER NOT NULL DEFAULT 0,
  level_points INTEGER NOT NULL DEFAULT 0,
  next_level_threshold INTEGER NOT NULL DEFAULT 500,
  level_achieved_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء فهارس للأداء إذا لم تكن موجودة
CREATE INDEX IF NOT EXISTS idx_user_levels_user_id ON public.user_levels(user_id);
CREATE INDEX IF NOT EXISTS idx_user_levels_level ON public.user_levels(current_level);
CREATE INDEX IF NOT EXISTS idx_user_levels_points ON public.user_levels(total_points DESC);

-- جدول التحالفات
CREATE TABLE IF NOT EXISTS public.alliances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  leader_id UUID NOT NULL,
  status alliance_status NOT NULL DEFAULT 'active',
  member_count INTEGER NOT NULL DEFAULT 0,
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
  user_id UUID NOT NULL,
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
  user_id UUID NOT NULL,
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
  user_id UUID NOT NULL,
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
  user_id UUID NOT NULL,
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
  reporter_id UUID NOT NULL,
  reported_alliance_id UUID NOT NULL REFERENCES public.alliances(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  action_taken TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_alliance_reports_status ON public.alliance_reports(status);
CREATE INDEX IF NOT EXISTS idx_alliance_reports_alliance ON public.alliance_reports(reported_alliance_id);