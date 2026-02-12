-- ============================================
-- إصلاح أمني شامل - المرحلة 2: Views و Functions
-- ============================================

-- 1. تحديث Views من SECURITY DEFINER إلى SECURITY INVOKER
DO $$
DECLARE
    view_record RECORD;
BEGIN
    FOR view_record IN 
        SELECT schemaname, viewname
        FROM pg_views 
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE format('ALTER VIEW %I.%I SET (security_invoker = true)', 
                view_record.schemaname, view_record.viewname);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not update view %: %', view_record.viewname, SQLERRM;
        END;
    END LOOP;
END$$;

-- 2. تحديث الدوال لإضافة search_path = public

-- تحديث دالة add_atlantis_xp
CREATE OR REPLACE FUNCTION public.add_atlantis_xp(p_user_id uuid, p_xp integer, p_points integer DEFAULT 0)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_xp INTEGER;
    v_current_level TEXT;
    v_new_level TEXT;
    v_level_changed BOOLEAN := false;
    v_result JSONB;
BEGIN
    INSERT INTO atlantis_user_levels (user_id, current_xp, total_xp, atlantis_points, current_level)
    VALUES (p_user_id, p_xp, p_xp, p_points, 'bronze')
    ON CONFLICT (user_id) DO UPDATE SET
        current_xp = atlantis_user_levels.current_xp + p_xp,
        total_xp = atlantis_user_levels.total_xp + p_xp,
        atlantis_points = atlantis_user_levels.atlantis_points + p_points,
        updated_at = now(),
        last_activity_at = now()
    RETURNING current_xp, current_level INTO v_current_xp, v_current_level;

    v_new_level := CASE
        WHEN v_current_xp >= 50000 THEN 'legendary'
        WHEN v_current_xp >= 20000 THEN 'platinum'
        WHEN v_current_xp >= 5000 THEN 'gold'
        WHEN v_current_xp >= 1000 THEN 'silver'
        ELSE 'bronze'
    END;

    IF v_new_level != v_current_level THEN
        UPDATE atlantis_user_levels
        SET current_level = v_new_level
        WHERE user_id = p_user_id;
        v_level_changed := true;
    END IF;

    v_result := jsonb_build_object(
        'success', true,
        'new_xp', v_current_xp,
        'level', v_new_level,
        'level_changed', v_level_changed,
        'xp_added', p_xp,
        'points_added', p_points
    );

    RETURN v_result;
END;
$$;

-- تحديث دالة check_and_grant_badges
CREATE OR REPLACE FUNCTION public.check_and_grant_badges(p_user_id uuid)
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
    SELECT total_xp, total_sales_count, total_sales_amount, challenges_completed
    INTO v_user_stats
    FROM atlantis_user_levels
    WHERE user_id = p_user_id;

    IF v_user_stats IS NULL THEN
        RETURN 0;
    END IF;

    FOR v_badge IN 
        SELECT * FROM badges WHERE is_active = true
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM user_badges 
            WHERE user_id = p_user_id AND badge_id = v_badge.id
        ) THEN
            IF (v_badge.requirement_type = 'total_xp' AND v_user_stats.total_xp >= v_badge.requirement_value) OR
               (v_badge.requirement_type = 'total_sales_count' AND v_user_stats.total_sales_count >= v_badge.requirement_value) OR
               (v_badge.requirement_type = 'total_sales_amount' AND v_user_stats.total_sales_amount >= v_badge.requirement_value) OR
               (v_badge.requirement_type = 'challenges_completed' AND v_user_stats.challenges_completed >= v_badge.requirement_value)
            THEN
                INSERT INTO user_badges (user_id, badge_id)
                VALUES (p_user_id, v_badge.id);
                
                UPDATE atlantis_user_levels
                SET 
                    total_xp = total_xp + v_badge.xp_reward,
                    current_xp = current_xp + v_badge.xp_reward,
                    atlantis_points = atlantis_points + v_badge.points_reward
                WHERE user_id = p_user_id;
                
                v_badges_granted := v_badges_granted + 1;
            END IF;
        END IF;
    END LOOP;

    RETURN v_badges_granted;
END;
$$;

-- تحديث دالة has_role باستخدام النوع الصحيح user_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
        AND role = _role
    )
$$;

-- تحديث دالة update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;