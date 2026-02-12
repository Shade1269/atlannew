import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE;

if (!url || !serviceRole) {
  throw new Error('Supabase credentials are not configured');
}

const supabase = createClient(url, serviceRole, {
  auth: { persistSession: false },
});

function summarize(records: any[]) {
  const totals = records.reduce<Record<string, number>>((acc, record) => {
    const key = record.status ?? 'unknown';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  return totals;
}

export async function runAudit() {
  const { data, error } = await supabase
    .from('change_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  const summary = summarize(data ?? []);
  return {
    total: data?.length ?? 0,
    summary,
    latest: data?.map((record) => ({
      id: record.id,
      status: record.status,
      risk_level: record.risk_level,
      created_at: record.created_at,
      pr_number: record.pr_number,
    })) ?? [],
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runAudit()
    .then((report) => {
      console.log('Recent change requests:', report.total);
      console.table(report.latest);
      console.log('Status summary:', report.summary);
    })
    .catch((err) => {
      console.error('Audit failed:', err);
      process.exit(1);
    });
}
