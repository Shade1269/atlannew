import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';


const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface PointsUpdateData {
  userId: string;
  action: 'sale_completed' | 'new_customer' | 'challenge_completed' | 'manual_add';
  amount?: number;
  metadata?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const { userId, action, amount = 0, metadata = {} }: PointsUpdateData = await req.json();

    if (!userId || !action) {
      throw new Error('Missing required fields: userId, action');
    }

    // Calculate points based on action type
    let pointsToAdd = 0;
    let reason = '';

    switch (action) {
      case 'sale_completed':
        pointsToAdd = Math.floor((amount || 0) * 0.1); // 10% of sale amount as points
        reason = `مبيعة بقيمة ${amount} ر.س`;
        break;
      
      case 'new_customer':
        pointsToAdd = 25;
        reason = 'جلب عميل جديد';
        break;
      
      case 'challenge_completed':
        pointsToAdd = metadata.bonus_points || 100;
        reason = `إكمال تحدي: ${metadata.challenge_name || 'تحدي أسبوعي'}`;
        break;
      
      case 'manual_add':
        pointsToAdd = amount || 0;
        reason = metadata.reason || 'إضافة يدوية';
        break;
      
      default:
        throw new Error(`Unknown action type: ${action}`);
    }

    if (pointsToAdd <= 0) {
      throw new Error('No points to add');
    }

    // Get user's current profile
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('auth_user_id', userId)
      .single();

    if (profileError || !profiles) {
      throw new Error('User profile not found');
    }

    const profileId = profiles.id;

    // Get or create user level
    let { data: userLevel, error: levelError } = await supabase
      .from('user_levels')
      .select('*')
      .eq('user_id', profileId)
      .single();

    if (levelError && levelError.code === 'PGRST116') {
      // Create new user level if doesn't exist
      const { data: newLevel, error: createError } = await supabase
        .from('user_levels')
        .insert({
          user_id: profileId,
          current_level: 'bronze',
          total_points: 0,
          level_points: 0,
          next_level_threshold: 500
        })
        .select()
        .single();

      if (createError) throw createError;
      userLevel = newLevel;
    } else if (levelError) {
      throw levelError;
    }

    // Calculate new totals
    const newTotalPoints = userLevel.total_points + pointsToAdd;
    const newLevelPoints = userLevel.level_points + pointsToAdd;

    // Determine new level
    let newLevel = userLevel.current_level;
    let newThreshold = userLevel.next_level_threshold;
    let levelChanged = false;

    if (newTotalPoints >= 5000 && userLevel.current_level !== 'legendary') {
      newLevel = 'legendary';
      newThreshold = 5000;
      levelChanged = true;
    } else if (newTotalPoints >= 2000 && userLevel.current_level === 'silver') {
      newLevel = 'gold';
      newThreshold = 5000;
      levelChanged = true;
    } else if (newTotalPoints >= 500 && userLevel.current_level === 'bronze') {
      newLevel = 'silver';
      newThreshold = 2000;
      levelChanged = true;
    }

    // Update user level
    const { error: updateError } = await supabase
      .from('user_levels')
      .update({
        total_points: newTotalPoints,
        level_points: newLevelPoints,
        current_level: newLevel,
        next_level_threshold: newThreshold,
        level_achieved_at: levelChanged ? new Date().toISOString() : userLevel.level_achieved_at,
        updated_at: new Date().toISOString()
      })
      .eq('id', userLevel.id);

    if (updateError) throw updateError;

    // Update profile points
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        points: newTotalPoints,
        level: newLevel,
        updated_at: new Date().toISOString()
      })
      .eq('id', profileId);

    if (profileUpdateError) throw profileUpdateError;

    // If user is in an alliance, update contribution points
    const { data: membership } = await supabase
      .from('alliance_members')
      .select('id, alliance_id, contribution_points')
      .eq('user_id', profileId)
      .eq('is_active', true)
      .single();

    if (membership) {
      await supabase
        .from('alliance_members')
        .update({
          contribution_points: membership.contribution_points + pointsToAdd,
          last_activity_at: new Date().toISOString()
        })
        .eq('id', membership.id);

      // Get alliance current points
      const { data: alliance } = await supabase
        .from('alliances')
        .select('total_points')
        .eq('id', membership.alliance_id)
        .single();

      // Update alliance total points
      await supabase
        .from('alliances')
        .update({
          total_points: (alliance?.total_points || 0) + pointsToAdd,
          updated_at: new Date().toISOString()
        })
        .eq('id', membership.alliance_id);
    }

    // Log the activity
    await supabase
      .from('user_activities')
      .insert({
        user_id: profileId,
        activity_type: 'points_earned',
        description: `+${pointsToAdd} نقطة - ${reason}`,
        metadata: {
          points_added: pointsToAdd,
          action,
          level_changed: levelChanged,
          new_level: newLevel,
          ...metadata
        }
      });

    // Prepare response
    const response = {
      success: true,
      points_added: pointsToAdd,
      new_total_points: newTotalPoints,
      level_changed: levelChanged,
      new_level: newLevel,
      reason,
      alliance_updated: !!membership
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error updating points:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});