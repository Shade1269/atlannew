-- =============================================
-- Atlantis Gamification System - Badges
-- Created: 2026-01-31
-- =============================================

-- جدول الشارات المتاحة
CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- معلومات الشارة
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  
  -- الأيقونة
  icon TEXT NOT NULL DEFAULT '🏆',
  icon_url TEXT,
  
  -- التصنيف
  category TEXT NOT NULL CHECK (category IN ('sales', 'challenges', 'loyalty', 'social', 'special')),
  rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  
  -- متطلبات الحصول
  requirement_type TEXT NOT NULL CHECK (requirement_type IN (
    'sales_count', 'sales_amount', 'challenges_completed', 
    'days_active', 'referrals', 'level_reached', 'special'
  )),
  requirement_value INTEGER NOT NULL DEFAULT 1,
  
  -- المكافأة
  xp_reward INTEGER DEFAULT 0,
  points_reward INTEGER DEFAULT 0,
  
  -- الترتيب للعرض
  display_order INTEGER DEFAULT 0,
  
  -- الحالة
  is_active BOOLEAN DEFAULT true,
  is_secret BOOLEAN DEFAULT false, -- شارات مخفية حتى تُكتسب
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- جدول شارات المستخدمين
CREATE TABLE IF NOT EXISTS user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id uuid REFERENCES badges(id) ON DELETE CASCADE,
  
  earned_at TIMESTAMPTZ DEFAULT now(),
  is_displayed BOOLEAN DEFAULT true, -- هل تُعرض في البروفايل
  
  UNIQUE(user_id, badge_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_badges_category ON badges(category);
CREATE INDEX IF NOT EXISTS idx_badges_rarity ON badges(rarity);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);

-- Enable RLS
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Policies for badges
CREATE POLICY "Anyone can view active badges" ON badges
  FOR SELECT USING (is_active = true AND (is_secret = false OR EXISTS (
    SELECT 1 FROM user_badges WHERE user_badges.badge_id = badges.id AND user_badges.user_id = auth.uid()
  )));

CREATE POLICY "Admins can manage badges" ON badges
  FOR ALL USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- Policies for user_badges
CREATE POLICY "Users can view their own badges" ON user_badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view others displayed badges" ON user_badges
  FOR SELECT USING (is_displayed = true);

CREATE POLICY "System can grant badges" ON user_badges
  FOR INSERT WITH CHECK (true);

-- =============================================
-- إدخال الشارات الافتراضية
-- =============================================

INSERT INTO badges (name_ar, name_en, icon, category, rarity, requirement_type, requirement_value, xp_reward, points_reward, display_order) VALUES
-- شارات المبيعات
('أول بيعة', 'First Sale', '🎉', 'sales', 'common', 'sales_count', 1, 50, 10, 1),
('بائع نشط', 'Active Seller', '💪', 'sales', 'common', 'sales_count', 10, 100, 25, 2),
('تاجر محترف', 'Pro Trader', '🏆', 'sales', 'rare', 'sales_count', 50, 250, 50, 3),
('نجم المبيعات', 'Sales Star', '⭐', 'sales', 'rare', 'sales_count', 100, 500, 100, 4),
('أسطورة التجارة', 'Trade Legend', '👑', 'sales', 'legendary', 'sales_count', 500, 1000, 250, 5),

('100 ريال مبيعات', '100 SAR Sales', '💰', 'sales', 'common', 'sales_amount', 100, 25, 5, 10),
('1000 ريال مبيعات', '1K SAR Sales', '💵', 'sales', 'common', 'sales_amount', 1000, 100, 20, 11),
('10K ريال مبيعات', '10K SAR Sales', '🤑', 'sales', 'rare', 'sales_amount', 10000, 300, 75, 12),
('100K ريال مبيعات', '100K SAR Sales', '💎', 'sales', 'epic', 'sales_amount', 100000, 750, 200, 13),
('مليونير', 'Millionaire', '🏦', 'sales', 'legendary', 'sales_amount', 1000000, 2000, 500, 14),

-- شارات التحديات
('منافس', 'Competitor', '🎯', 'challenges', 'common', 'challenges_completed', 1, 30, 10, 20),
('محارب', 'Warrior', '⚔️', 'challenges', 'common', 'challenges_completed', 5, 100, 25, 21),
('بطل التحديات', 'Challenge Champion', '🏅', 'challenges', 'rare', 'challenges_completed', 20, 300, 75, 22),
('أسطورة التحديات', 'Challenge Legend', '🔥', 'challenges', 'legendary', 'challenges_completed', 50, 750, 200, 23),

-- شارات الولاء
('عضو جديد', 'New Member', '🌱', 'loyalty', 'common', 'days_active', 1, 10, 5, 30),
('عضو نشط', 'Active Member', '🌿', 'loyalty', 'common', 'days_active', 7, 50, 15, 31),
('عضو مخلص', 'Loyal Member', '🌳', 'loyalty', 'rare', 'days_active', 30, 150, 40, 32),
('عضو ذهبي', 'Gold Member', '🌟', 'loyalty', 'epic', 'days_active', 90, 400, 100, 33),
('عضو أسطوري', 'Legendary Member', '🏆', 'loyalty', 'legendary', 'days_active', 365, 1000, 300, 34),

-- شارات المستويات
('المستوى الفضي', 'Silver Level', '🥈', 'special', 'rare', 'level_reached', 2, 200, 50, 40),
('المستوى الذهبي', 'Gold Level', '🥇', 'special', 'epic', 'level_reached', 3, 500, 150, 41),
('المستوى البلاتيني', 'Platinum Level', '💠', 'special', 'epic', 'level_reached', 4, 1000, 300, 42),
('المستوى الأسطوري', 'Legendary Level', '👑', 'special', 'legendary', 'level_reached', 5, 2500, 750, 43),

-- شارات اجتماعية
('مُحيل', 'Referrer', '🤝', 'social', 'common', 'referrals', 1, 75, 25, 50),
('سفير', 'Ambassador', '🌍', 'social', 'rare', 'referrals', 10, 300, 100, 51),
('مؤثر', 'Influencer', '📣', 'social', 'epic', 'referrals', 50, 750, 250, 52)

ON CONFLICT DO NOTHING;

-- Function لمنح شارة
CREATE OR REPLACE FUNCTION grant_badge(
  p_user_id uuid,
  p_badge_id uuid
)
RETURNS BOOLEAN AS $$
DECLARE
  v_xp_reward INTEGER;
  v_points_reward INTEGER;
BEGIN
  -- Check if already has badge
  IF EXISTS (SELECT 1 FROM user_badges WHERE user_id = p_user_id AND badge_id = p_badge_id) THEN
    RETURN false;
  END IF;
  
  -- Get rewards
  SELECT xp_reward, points_reward INTO v_xp_reward, v_points_reward
  FROM badges WHERE id = p_badge_id;
  
  -- Grant badge
  INSERT INTO user_badges (user_id, badge_id) VALUES (p_user_id, p_badge_id);
  
  -- Add rewards
  IF v_xp_reward > 0 OR v_points_reward > 0 THEN
    PERFORM add_atlantis_xp(p_user_id, v_xp_reward, v_points_reward);
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function للتحقق من الشارات المستحقة ومنحها
CREATE OR REPLACE FUNCTION check_and_grant_badges(p_user_id uuid)
RETURNS INTEGER AS $$
DECLARE
  v_badge RECORD;
  v_granted INTEGER := 0;
  v_user_stats RECORD;
BEGIN
  -- Get user stats
  SELECT 
    COALESCE(aul.sales_count, 0) as sales_count,
    COALESCE(aul.total_sales_amount, 0) as sales_amount,
    COALESCE(aul.challenges_completed, 0) as challenges_completed,
    EXTRACT(DAY FROM now() - COALESCE(aul.created_at, now())) as days_active,
    CASE aul.current_level 
      WHEN 'bronze' THEN 1 WHEN 'silver' THEN 2 WHEN 'gold' THEN 3 
      WHEN 'platinum' THEN 4 WHEN 'legendary' THEN 5 ELSE 1 
    END as level_num,
    (SELECT COUNT(*) FROM profiles WHERE referred_by = (SELECT username FROM profiles WHERE id = p_user_id)) as referrals
  INTO v_user_stats
  FROM atlantis_user_levels aul
  WHERE aul.user_id = p_user_id;
  
  -- Check each badge
  FOR v_badge IN SELECT * FROM badges WHERE is_active = true LOOP
    -- Skip if already earned
    IF EXISTS (SELECT 1 FROM user_badges WHERE user_id = p_user_id AND badge_id = v_badge.id) THEN
      CONTINUE;
    END IF;
    
    -- Check requirement
    CASE v_badge.requirement_type
      WHEN 'sales_count' THEN
        IF v_user_stats.sales_count >= v_badge.requirement_value THEN
          PERFORM grant_badge(p_user_id, v_badge.id);
          v_granted := v_granted + 1;
        END IF;
      WHEN 'sales_amount' THEN
        IF v_user_stats.sales_amount >= v_badge.requirement_value THEN
          PERFORM grant_badge(p_user_id, v_badge.id);
          v_granted := v_granted + 1;
        END IF;
      WHEN 'challenges_completed' THEN
        IF v_user_stats.challenges_completed >= v_badge.requirement_value THEN
          PERFORM grant_badge(p_user_id, v_badge.id);
          v_granted := v_granted + 1;
        END IF;
      WHEN 'days_active' THEN
        IF v_user_stats.days_active >= v_badge.requirement_value THEN
          PERFORM grant_badge(p_user_id, v_badge.id);
          v_granted := v_granted + 1;
        END IF;
      WHEN 'level_reached' THEN
        IF v_user_stats.level_num >= v_badge.requirement_value THEN
          PERFORM grant_badge(p_user_id, v_badge.id);
          v_granted := v_granted + 1;
        END IF;
      WHEN 'referrals' THEN
        IF v_user_stats.referrals >= v_badge.requirement_value THEN
          PERFORM grant_badge(p_user_id, v_badge.id);
          v_granted := v_granted + 1;
        END IF;
      ELSE
        NULL;
    END CASE;
  END LOOP;
  
  RETURN v_granted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
