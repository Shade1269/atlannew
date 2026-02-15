import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PlatformStats {
  products: number;
  users: number;
  stores: number;
  /** دائماً 100% كما طُلِب */
  satisfaction: number;
}

const DEFAULT_STATS: PlatformStats = {
  products: 0,
  users: 0,
  stores: 0,
  satisfaction: 100,
};

export function usePlatformStats(): PlatformStats {
  const [stats, setStats] = useState<PlatformStats>(DEFAULT_STATS);

  useEffect(() => {
    let cancelled = false;

    async function fetchCounts() {
      try {
        const [productsRes, usersRes, storesRes] = await Promise.all([
          supabase.from('products').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('affiliate_stores').select('*', { count: 'exact', head: true }),
        ]);

        if (cancelled) return;

        setStats({
          products: productsRes.count ?? 0,
          users: usersRes.count ?? 0,
          stores: storesRes.count ?? 0,
          satisfaction: 100,
        });
      } catch {
        if (!cancelled) setStats(DEFAULT_STATS);
      }
    }

    fetchCounts();
    return () => { cancelled = true; };
  }, []);

  return stats;
}
