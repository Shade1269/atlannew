-- =============================================
-- Atlantis Gamification System - User Levels
-- Created: 2026-01-31
-- =============================================

-- جدول مستويات المستخدمين في نظام أتلانتس
CREATE TABLE IF NOT EXISTS atlantis_user_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- المستوى الحالي
  current_level TEXT DEFAULT 'bronze' CHECK (current_level IN ('bronze', 'silver', 'gold', 'platinum', 'legendary')),
  
  -- نقاط الخبرة
  current_xp INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  
  -- نقاط أتلانتس (العملة الافتراضية)
  atlantis_points INTEGER DEFAULT 0,
  total_earned_points INTEGER DEFAULT 0,
  total_spent_points INTEGER DEFAULT 0,
  
  -- إحصائيات
  challenges_completed INTEGER DEFAULT 0,
  sales_count INTEGER DEFAULT 0,
  total_sales_amount DECIMAL(12,2) DEFAULT 0,
  
  -- الرتبة في Leaderboard
  current_rank INTEGER DEFAULT 0,
  highest_rank INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_activity_at TIMESTAMPTZ DEFAULT now()
);

-- Index للبحث السريع
CREATE INDEX IF NOT EXISTS idx_atlantis_user_levels_user_id ON atlantis_user_levels(user_id);
CREATE INDEX IF NOT EXISTS idx_atlantis_user_levels_level ON atlantis_user_levels(current_level);
CREATE INDEX IF NOT EXISTS idx_atlantis_user_levels_points ON atlantis_user_levels(atlantis_points DESC);
CREATE INDEX IF NOT EXISTS idx_atlantis_user_levels_rank ON atlantis_user_levels(current_rank);

-- Enable RLS
ALTER TABLE atlantis_user_levels ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own level" ON atlantis_user_levels
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view leaderboard" ON atlantis_user_levels
  FOR SELECT USING (true);

CREATE POLICY "System can insert levels" ON atlantis_user_levels
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update levels" ON atlantis_user_levels
  FOR UPDATE USING (true);

-- Function لإنشاء مستوى للمستخدم الجديد تلقائياً
CREATE OR REPLACE FUNCTION create_atlantis_level_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO atlantis_user_levels (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger عند إنشاء مستخدم جديد
DROP TRIGGER IF EXISTS on_auth_user_created_atlantis ON auth.users;
CREATE TRIGGER on_auth_user_created_atlantis
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_atlantis_level_for_new_user();

-- Function لحساب المستوى من XP
CREATE OR REPLACE FUNCTION calculate_atlantis_level(xp INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF xp >= 50000 THEN RETURN 'legendary';
  ELSIF xp >= 20000 THEN RETURN 'platinum';
  ELSIF xp >= 5000 THEN RETURN 'gold';
  ELSIF xp >= 1000 THEN RETURN 'silver';
  ELSE RETURN 'bronze';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function لإضافة نقاط XP وتحديث المستوى
CREATE OR REPLACE FUNCTION add_atlantis_xp(
  p_user_id uuid,
  p_xp_amount INTEGER,
  p_points_amount INTEGER DEFAULT 0
)
RETURNS TABLE(new_level TEXT, level_up BOOLEAN, new_xp INTEGER, new_points INTEGER) AS $$
DECLARE
  v_old_level TEXT;
  v_new_level TEXT;
  v_current_xp INTEGER;
  v_current_points INTEGER;
BEGIN
  -- Get current values
  SELECT current_level, current_xp, atlantis_points
  INTO v_old_level, v_current_xp, v_current_points
  FROM atlantis_user_levels
  WHERE user_id = p_user_id;
  
  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO atlantis_user_levels (user_id)
    VALUES (p_user_id);
    v_old_level := 'bronze';
    v_current_xp := 0;
    v_current_points := 0;
  END IF;
  
  -- Calculate new values
  v_current_xp := v_current_xp + p_xp_amount;
  v_current_points := v_current_points + p_points_amount;
  v_new_level := calculate_atlantis_level(v_current_xp);
  
  -- Update the record
  UPDATE atlantis_user_levels SET
    current_xp = v_current_xp,
    total_xp = total_xp + p_xp_amount,
    atlantis_points = v_current_points,
    total_earned_points = CASE WHEN p_points_amount > 0 THEN total_earned_points + p_points_amount ELSE total_earned_points END,
    current_level = v_new_level,
    updated_at = now(),
    last_activity_at = now()
  WHERE user_id = p_user_id;
  
  RETURN QUERY SELECT v_new_level, (v_new_level != v_old_level), v_current_xp, v_current_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
