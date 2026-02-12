-- Fix v_user_stats view with correct columns
CREATE OR REPLACE VIEW v_user_stats AS
SELECT 
  p.id,
  p.auth_user_id,
  p.full_name,
  p.role,
  p.level,
  p.current_level,
  p.points,
  p.total_points,
  p.level_points,
  p.next_level_threshold,
  p.total_earnings,
  p.created_shops_count,
  p.is_active,
  p.created_at,
  p.last_activity_at,
  ul.total_points as user_level_points,
  ul.level_points as current_level_points,
  ul.level_achieved_at
FROM profiles p
LEFT JOIN user_levels ul ON ul.user_id = p.id
WHERE p.is_active = true;

-- Grant access
GRANT SELECT ON v_user_stats TO authenticated;

COMMENT ON VIEW v_user_stats IS 'Comprehensive user statistics combining profile and level data';