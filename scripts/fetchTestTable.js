import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY environment variables.');
  process.exit(1);
}

async function main() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await supabase.from('test_table').select('*');

    if (error) {
      throw error;
    }

    console.log('Query results:', data);
  } catch (err) {
    console.error('Error querying test_table:', err);
    process.exitCode = 1;
  }
}

main();
