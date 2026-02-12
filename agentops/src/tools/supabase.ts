import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE;

if (!url || !serviceRole) {
  throw new Error('Supabase credentials are not configured');
}

const supabase = createClient(url, serviceRole, {
  auth: { persistSession: false },
});

type ChangeRecord = {
  id: string;
  source: string;
  message: string;
  proposed_sql?: string | null;
  proposed_files?: Array<{ path: string; content: string }> | null;
  risk_level?: string | null;
  summary?: string | null;
  status: string;
  pr_url?: string | null;
  pr_number?: number | null;
  created_at?: string;
  approved_at?: string | null;
  approved_by?: string | null;
};

export async function recordChange(row: Partial<ChangeRecord>) {
  const { data, error } = await supabase.from('change_requests').insert(row).select().single();
  if (error) throw error;
  return data as ChangeRecord;
}

export async function updateChange(id: string, patch: Partial<ChangeRecord>) {
  const { data, error } = await supabase.from('change_requests').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data as ChangeRecord;
}

export async function getChange(id: string) {
  const { data, error } = await supabase.from('change_requests').select('*').eq('id', id).single();
  if (error) throw error;
  return data as ChangeRecord;
}
