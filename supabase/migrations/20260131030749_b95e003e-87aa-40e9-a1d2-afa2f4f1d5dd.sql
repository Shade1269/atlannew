-- جدول مستويات المستخدمين في أتلانتس
CREATE TABLE IF NOT EXISTS atlantis_user_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  current_level TEXT NOT NULL DEFAULT 'bronze' CHECK (current_level IN ('bronze', 'silver', 'gold', 'platinum', 'legendary')),
  current_xp INTEGER NOT NULL DEFAULT 0,
  total_xp INTEGER NOT NULL DEFAULT 0,
  atlantis_points INTEGER NOT NULL DEFAULT 0,
  total_sales_count INTEGER NOT NULL DEFAULT 0,
  total_sales_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  challenges_completed INTEGER NOT NULL DEFAULT 0,
  current_rank INTEGER,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_atlantis_levels_user ON atlantis_user_levels(user_id);
CREATE INDEX IF NOT EXISTS idx_atlantis_levels_level ON atlantis_user_levels(current_level);
CREATE INDEX IF NOT EXISTS idx_atlantis_levels_xp ON atlantis_user_levels(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_atlantis_levels_points ON atlantis_user_levels(atlantis_points DESC);

-- تفعيل RLS
ALTER TABLE atlantis_user_levels ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "Users can view own level" ON atlantis_user_levels
  FOR SELECT USING (auth.uid()::text = user_id::text OR EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = atlantis_user_levels.user_id AND profiles.auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can view leaderboard" ON atlantis_user_levels
  FOR SELECT USING (true);

-- دالة حساب المستوى
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
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

-- دالة إضافة XP ونقاط
CREATE OR REPLACE FUNCTION add_atlantis_xp(
  p_user_id UUID,
  p_xp INTEGER,
  p_points INTEGER DEFAULT 0
)
RETURNS TABLE(new_level TEXT, level_up BOOLEAN, new_xp INTEGER, new_points INTEGER) AS $$
DECLARE
  v_old_level TEXT;
  v_new_level TEXT;
  v_current_xp INTEGER;
  v_current_points INTEGER;
BEGIN
  -- الحصول على البيانات الحالية أو إنشاء سجل جديد
  INSERT INTO atlantis_user_levels (user_id, current_xp, total_xp, atlantis_points)
  VALUES (p_user_id, p_xp, p_xp, p_points)
  ON CONFLICT (user_id) DO UPDATE SET
    current_xp = atlantis_user_levels.current_xp + p_xp,
    total_xp = atlantis_user_levels.total_xp + p_xp,
    atlantis_points = atlantis_user_levels.atlantis_points + p_points,
    last_activity_at = NOW(),
    updated_at = NOW()
  RETURNING current_level, current_xp, atlantis_points INTO v_old_level, v_current_xp, v_current_points;
  
  -- حساب المستوى الجديد
  v_new_level := calculate_atlantis_level(v_current_xp);
  
  -- تحديث المستوى إذا تغير
  IF v_new_level != v_old_level THEN
    UPDATE atlantis_user_levels 
    SET current_level = v_new_level, updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
  
  RETURN QUERY SELECT v_new_level, (v_new_level != v_old_level), v_current_xp, v_current_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;