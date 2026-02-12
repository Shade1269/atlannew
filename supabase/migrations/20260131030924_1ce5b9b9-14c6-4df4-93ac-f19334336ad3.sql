-- جدول الشارات
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('sales', 'challenges', 'loyalty', 'social', 'special')),
  rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL DEFAULT 0,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  points_reward INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- جدول شارات المستخدمين
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- فهارس
CREATE INDEX IF NOT EXISTS idx_badges_category ON badges(category);
CREATE INDEX IF NOT EXISTS idx_badges_rarity ON badges(rarity);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON user_badges(badge_id);

-- تفعيل RLS
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "Anyone can view badges" ON badges FOR SELECT USING (true);
CREATE POLICY "Users can view own badges" ON user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage badges" ON user_badges FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- الشارات الافتراضية
INSERT INTO badges (name_ar, name_en, description_ar, description_en, icon, category, rarity, requirement_type, requirement_value, xp_reward, points_reward) VALUES
-- شارات المبيعات
('البداية', 'First Steps', 'أول عملية بيع', 'Complete first sale', '🎯', 'sales', 'common', 'sales_count', 1, 50, 25),
('بائع نشط', 'Active Seller', '10 عمليات بيع', '10 sales completed', '🔥', 'sales', 'common', 'sales_count', 10, 100, 50),
('نجم المبيعات', 'Sales Star', '50 عملية بيع', '50 sales completed', '⭐', 'sales', 'rare', 'sales_count', 50, 300, 150),
('محترف المبيعات', 'Sales Pro', '100 عملية بيع', '100 sales completed', '💎', 'sales', 'epic', 'sales_count', 100, 500, 250),
('أسطورة المبيعات', 'Sales Legend', '500 عملية بيع', '500 sales completed', '👑', 'sales', 'legendary', 'sales_count', 500, 1000, 500),
-- شارات المبالغ
('ألف ريال', '1K Club', 'مبيعات 1000 ريال', '1000 SAR in sales', '💰', 'sales', 'common', 'sales_amount', 1000, 100, 50),
('10 آلاف', '10K Club', 'مبيعات 10000 ريال', '10000 SAR in sales', '💎', 'sales', 'rare', 'sales_amount', 10000, 300, 150),
('100 ألف', '100K Club', 'مبيعات 100000 ريال', '100000 SAR in sales', '🏆', 'sales', 'legendary', 'sales_amount', 100000, 1000, 500),
-- شارات التحديات
('المنافس', 'Challenger', 'أول تحدي', 'Complete first challenge', '🎮', 'challenges', 'common', 'challenges_completed', 1, 50, 25),
('بطل التحديات', 'Challenge Champion', '10 تحديات', '10 challenges completed', '🏅', 'challenges', 'rare', 'challenges_completed', 10, 200, 100),
('سيد التحديات', 'Challenge Master', '50 تحدي', '50 challenges completed', '🎖️', 'challenges', 'epic', 'challenges_completed', 50, 500, 250),
-- شارات الولاء
('عضو جديد', 'New Member', 'أسبوع في المنصة', '1 week on platform', '🌱', 'loyalty', 'common', 'days_active', 7, 25, 10),
('عضو فعال', 'Active Member', 'شهر في المنصة', '1 month on platform', '🌿', 'loyalty', 'common', 'days_active', 30, 100, 50),
('عضو مخلص', 'Loyal Member', '3 أشهر في المنصة', '3 months on platform', '🌳', 'loyalty', 'rare', 'days_active', 90, 300, 150),
('عضو ذهبي', 'Gold Member', 'سنة في المنصة', '1 year on platform', '🏛️', 'loyalty', 'legendary', 'days_active', 365, 1000, 500)
ON CONFLICT DO NOTHING;

-- دالة منح الشارة
CREATE OR REPLACE FUNCTION grant_badge(p_user_id UUID, p_badge_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_badge RECORD;
BEGIN
  SELECT * INTO v_badge FROM badges WHERE id = p_badge_id AND is_active = true;
  IF NOT FOUND THEN RETURN false; END IF;
  
  INSERT INTO user_badges (user_id, badge_id)
  VALUES (p_user_id, p_badge_id)
  ON CONFLICT (user_id, badge_id) DO NOTHING;
  
  IF FOUND THEN
    PERFORM add_atlantis_xp(p_user_id, v_badge.xp_reward, v_badge.points_reward);
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- دالة التحقق من الشارات ومنحها
CREATE OR REPLACE FUNCTION check_and_grant_badges(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_user_stats RECORD;
  v_badge RECORD;
  v_granted INTEGER := 0;
BEGIN
  SELECT * INTO v_user_stats FROM atlantis_user_levels WHERE user_id = p_user_id;
  IF NOT FOUND THEN RETURN 0; END IF;
  
  FOR v_badge IN 
    SELECT b.* FROM badges b
    LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = p_user_id
    WHERE ub.id IS NULL AND b.is_active = true
  LOOP
    IF (v_badge.requirement_type = 'sales_count' AND v_user_stats.total_sales_count >= v_badge.requirement_value) OR
       (v_badge.requirement_type = 'sales_amount' AND v_user_stats.total_sales_amount >= v_badge.requirement_value) OR
       (v_badge.requirement_type = 'challenges_completed' AND v_user_stats.challenges_completed >= v_badge.requirement_value)
    THEN
      IF grant_badge(p_user_id, v_badge.id) THEN
        v_granted := v_granted + 1;
      END IF;
    END IF;
  END LOOP;
  
  RETURN v_granted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;