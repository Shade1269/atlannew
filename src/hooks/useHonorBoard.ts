import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StoreRankItem {
  rank: number;
  store_name: string;
  store_slug: string;
  total_sales: number;
  logo_url: string | null;
}

export interface ReferrerRankItem {
  rank: number;
  profile_id: string;
  full_name: string | null;
  referral_count: number;
}

export function useHonorBoard() {
  const [topStores, setTopStores] = useState<StoreRankItem[]>([]);
  const [topReferrers, setTopReferrers] = useState<ReferrerRankItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      setLoading(true);
      try {
        const [storesRes, referrersRes] = await Promise.all([
          fetchTopStoresBySales(),
          fetchTopReferrers(),
        ]);
        if (cancelled) return;
        setTopStores(storesRes);
        setTopReferrers(referrersRes);
      } catch {
        if (!cancelled) {
          setTopStores([]);
          setTopReferrers([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, []);

  return { topStores, topReferrers, loading };
}

async function fetchTopStoresBySales(): Promise<StoreRankItem[]> {
  const { data, error } = await supabase
    .from('affiliate_stores')
    .select('store_name, store_slug, total_sales, logo_url')
    .order('total_sales', { ascending: false, nullsFirst: false })
    .limit(10);

  if (error) return [];
  const list = (data || []).filter((r) => r != null);
  return list.map((row, i) => ({
    rank: i + 1,
    store_name: row.store_name ?? '',
    store_slug: row.store_slug ?? '',
    total_sales: Number(row.total_sales) || 0,
    logo_url: row.logo_url ?? null,
  }));
}

async function fetchTopReferrers(): Promise<ReferrerRankItem[]> {
  const { data: stores, error: storesError } = await supabase
    .from('affiliate_stores')
    .select('referred_by')
    .not('referred_by', 'is', null);

  if (storesError || !stores?.length) return [];

  const countByReferrer = new Map<string, number>();
  for (const row of stores) {
    const id = row.referred_by as string;
    if (id) countByReferrer.set(id, (countByReferrer.get(id) ?? 0) + 1);
  }

  const sorted = [...countByReferrer.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const ids = sorted.map(([id]) => id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', ids);

  const nameById = new Map<string, string | null>();
  for (const p of profiles ?? []) {
    nameById.set(p.id, p.full_name ?? null);
  }

  return sorted.map(([profile_id, referral_count], i) => ({
    rank: i + 1,
    profile_id,
    full_name: nameById.get(profile_id) ?? null,
    referral_count,
  }));
}
