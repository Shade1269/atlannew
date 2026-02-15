import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GoalStep {
  key: 'store' | 'products' | 'marketing' | 'referrals';
  label: string;
  done: boolean;
  value?: number;
}

export function useMarketerGoals(profileId: string | null, storeId: string | null) {
  const [steps, setSteps] = useState<GoalStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profileId) {
      setSteps([]);
      setLoading(false);
      return;
    }
    let cancelled = false;

    async function fetchGoals() {
      setLoading(true);
      try {
        const storeCreated = !!storeId;

        let productsCount = 0;
        if (storeId) {
          const { count } = await supabase
            .from('affiliate_products')
            .select('*', { count: 'exact', head: true })
            .eq('affiliate_store_id', storeId);
          productsCount = count ?? 0;
        }

        let referralCount = 0;
        const { data: refStores } = await supabase
          .from('affiliate_stores')
          .select('id')
          .eq('referred_by', profileId);
        referralCount = refStores?.length ?? 0;

        if (cancelled) return;

        const marketingStarted = storeCreated && productsCount > 0;

        setSteps([
          { key: 'store', label: 'store', done: storeCreated },
          { key: 'products', label: 'products', done: productsCount > 0, value: productsCount },
          { key: 'marketing', label: 'marketing', done: marketingStarted },
          { key: 'referrals', label: 'referrals', done: referralCount > 0, value: referralCount },
        ]);
      } catch {
        if (!cancelled) setSteps([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchGoals();
    return () => { cancelled = true; };
  }, [profileId, storeId]);

  const completedCount = steps.filter((s) => s.done).length;
  const percent = steps.length ? Math.round((completedCount / steps.length) * 100) : 0;

  return { steps, completedCount, percent, loading };
}
