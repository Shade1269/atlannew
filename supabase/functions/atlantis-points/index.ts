import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';
import { getSupabaseAdminClient } from '../_shared/supabase.ts';

/**
 * Atlantis Points Edge Function
 * إدارة نقاط أتلانتس للمستخدمين
 */

interface PointsRequest {
  userId: string;
  action: 'sale_completed' | 'new_customer' | 'challenge_completed' | 'manual_add' | 'spend_points' | 'check_badges';
  amount?: number;
  metadata?: Record<string, any>;
}

// مضاعفات النقاط والـ XP
const MULTIPLIERS = {
  sale_completed: { xpPerAmount: 0.1, pointsPerAmount: 0.05 },
  new_customer: { xp: 100, points: 50 },
  challenge_completed: { xp: 200, points: 100 },
  manual_add: { xp: 1, points: 1 },
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const supabase = getSupabaseAdminClient();

    const body: PointsRequest = await req.json();
    const { userId, action, amount = 0, metadata = {} } = body;

    if (!userId || !action) {
      return new Response(
        JSON.stringify({ success: false, error: 'userId and action are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let xpToAdd = 0;
    let pointsToAdd = 0;
    let result: any = { success: true };

    switch (action) {
      case 'sale_completed':
        xpToAdd = Math.floor(amount * MULTIPLIERS.sale_completed.xpPerAmount);
        pointsToAdd = Math.floor(amount * MULTIPLIERS.sale_completed.pointsPerAmount);
        
        // إضافة XP والنقاط
        await supabase.rpc('add_atlantis_xp', { p_user_id: userId, p_xp: xpToAdd, p_points: pointsToAdd });
        
        // تحديث إحصائيات المبيعات
        const { data: currentSalesStats } = await supabase
          .from('atlantis_user_levels')
          .select('total_sales_count, total_sales_amount')
          .eq('user_id', userId)
          .single();
        
        if (currentSalesStats) {
          await supabase
            .from('atlantis_user_levels')
            .update({ 
              total_sales_count: (currentSalesStats.total_sales_count || 0) + 1,
              total_sales_amount: (currentSalesStats.total_sales_amount || 0) + amount
            })
            .eq('user_id', userId);
        }
        break;

      case 'new_customer':
        xpToAdd = MULTIPLIERS.new_customer.xp;
        pointsToAdd = MULTIPLIERS.new_customer.points;
        await supabase.rpc('add_atlantis_xp', { p_user_id: userId, p_xp: xpToAdd, p_points: pointsToAdd });
        break;

      case 'challenge_completed':
        xpToAdd = metadata.xp_reward || MULTIPLIERS.challenge_completed.xp;
        pointsToAdd = metadata.points_reward || MULTIPLIERS.challenge_completed.points;
        
        const { data: addResult } = await supabase.rpc('add_atlantis_xp', { 
          p_user_id: userId, 
          p_xp: xpToAdd, 
          p_points: pointsToAdd 
        });
        
        // تحديث عدد التحديات المكتملة
        const { data: currentChallenges } = await supabase
          .from('atlantis_user_levels')
          .select('challenges_completed')
          .eq('user_id', userId)
          .single();
        
        if (currentChallenges) {
          await supabase
            .from('atlantis_user_levels')
            .update({ challenges_completed: (currentChallenges.challenges_completed || 0) + 1 })
            .eq('user_id', userId);
        }
          
        result = { ...result, ...addResult };
        break;

      case 'manual_add':
        xpToAdd = amount;
        pointsToAdd = metadata.points || 0;
        await supabase.rpc('add_atlantis_xp', { p_user_id: userId, p_xp: xpToAdd, p_points: pointsToAdd });
        break;

      case 'spend_points':
        const { data: userLevel } = await supabase
          .from('atlantis_user_levels')
          .select('atlantis_points')
          .eq('user_id', userId)
          .single();

        if (!userLevel || userLevel.atlantis_points < amount) {
          return new Response(
            JSON.stringify({ success: false, error: 'Insufficient points' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        await supabase
          .from('atlantis_user_levels')
          .update({ atlantis_points: userLevel.atlantis_points - amount })
          .eq('user_id', userId);

        result = { success: true, remaining_points: userLevel.atlantis_points - amount };
        break;

      case 'check_badges':
        const { data: badgesGranted } = await supabase.rpc('check_and_grant_badges', { p_user_id: userId });
        result = { success: true, badges_granted: badgesGranted || 0 };
        break;
    }

    // التحقق من الشارات بعد كل إجراء (ما عدا check_badges و spend_points)
    if (action !== 'check_badges' && action !== 'spend_points') {
      await supabase.rpc('check_and_grant_badges', { p_user_id: userId });
    }

    return new Response(
      JSON.stringify({ ...result, xp_added: xpToAdd, points_added: pointsToAdd }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
