-- Drop all functions first, then recreate with search_path

-- Drop all existing functions
DROP FUNCTION IF EXISTS public.calculate_atlantis_level(integer) CASCADE;
DROP FUNCTION IF EXISTS public.add_atlantis_xp(uuid, integer, integer) CASCADE;
DROP FUNCTION IF EXISTS public.check_and_grant_badges(uuid) CASCADE;

-- 1. Recreate calculate_atlantis_level
CREATE FUNCTION public.calculate_atlantis_level(xp integer)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
    IF xp >= 50000 THEN
        RETURN 'legendary';
    ELSIF xp >= 20000 THEN
        RETURN 'master';
    ELSIF xp >= 10000 THEN
        RETURN 'expert';
    ELSIF xp >= 5000 THEN
        RETURN 'veteran';
    ELSIF xp >= 2000 THEN
        RETURN 'skilled';
    ELSIF xp >= 500 THEN
        RETURN 'intermediate';
    ELSE
        RETURN 'rookie';
    END IF;
END;
$$;

-- 2. Recreate add_atlantis_xp
CREATE FUNCTION public.add_atlantis_xp(p_user_id uuid, p_xp integer, p_points integer DEFAULT 0)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_xp INTEGER;
    v_current_level TEXT;
    v_new_xp INTEGER;
    v_new_level TEXT;
    v_level_changed BOOLEAN := FALSE;
    v_result JSONB;
BEGIN
    SELECT current_xp, current_level INTO v_current_xp, v_current_level
    FROM atlantis_user_levels
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        INSERT INTO atlantis_user_levels (user_id, current_xp, total_xp, atlantis_points, current_level)
        VALUES (p_user_id, 0, 0, 0, 'rookie')
        RETURNING current_xp, current_level INTO v_current_xp, v_current_level;
    END IF;
    
    v_new_xp := v_current_xp + p_xp;
    v_new_level := public.calculate_atlantis_level(v_new_xp);
    
    IF v_new_level != v_current_level THEN
        v_level_changed := TRUE;
    END IF;
    
    UPDATE atlantis_user_levels
    SET 
        current_xp = v_new_xp,
        total_xp = total_xp + p_xp,
        atlantis_points = atlantis_points + p_points,
        current_level = v_new_level,
        last_activity_at = NOW(),
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    v_result := jsonb_build_object(
        'success', TRUE,
        'xp_added', p_xp,
        'points_added', p_points,
        'new_xp', v_new_xp,
        'new_level', v_new_level,
        'level_changed', v_level_changed,
        'previous_level', v_current_level
    );
    
    RETURN v_result;
END;
$$;

-- 3. Recreate check_and_grant_badges
CREATE FUNCTION public.check_and_grant_badges(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_stats RECORD;
    v_badge RECORD;
    v_badges_granted INTEGER := 0;
BEGIN
    SELECT 
        COALESCE(aul.total_xp, 0) as total_xp,
        COALESCE(aul.total_sales_count, 0) as total_sales,
        COALESCE(aul.challenges_completed, 0) as challenges_completed
    INTO v_user_stats
    FROM atlantis_user_levels aul
    WHERE aul.user_id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    FOR v_badge IN SELECT * FROM badges WHERE is_active = TRUE
    LOOP
        IF EXISTS (SELECT 1 FROM user_badges WHERE user_id = p_user_id AND badge_id = v_badge.id) THEN
            CONTINUE;
        END IF;
        
        IF (v_badge.requirement_type = 'xp' AND v_user_stats.total_xp >= v_badge.requirement_value) OR
           (v_badge.requirement_type = 'sales' AND v_user_stats.total_sales >= v_badge.requirement_value) OR
           (v_badge.requirement_type = 'challenges' AND v_user_stats.challenges_completed >= v_badge.requirement_value) THEN
            
            INSERT INTO user_badges (user_id, badge_id, earned_at)
            VALUES (p_user_id, v_badge.id, NOW())
            ON CONFLICT (user_id, badge_id) DO NOTHING;
            
            v_badges_granted := v_badges_granted + 1;
        END IF;
    END LOOP;
    
    RETURN v_badges_granted;
END;
$$;

-- 4. Fix update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;