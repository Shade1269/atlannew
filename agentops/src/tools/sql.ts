import OpenAI from 'openai';
import { Client } from 'pg';

let cachedClient: OpenAI | null = null;

function getOpenAI() {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  cachedClient = new OpenAI({ apiKey });
  return cachedClient;
}

export async function generateSQLFromText(message: string): Promise<string> {
  if (!message.trim()) return '';
  const response = await getOpenAI().responses.create({
    model: 'gpt-5.1-mini',
    input: [
      { role: 'system', content: 'اخرج SQL صالح لـPostgreSQL فقط بدون شروحات.' },
      { role: 'user', content: message },
    ],
  });
  const sql = response.output_text ?? '';
  return sql.trim();
}

export async function dryRunSQL(sql: string): Promise<{ errors: string[] }> {
  if (!sql.trim()) {
    return { errors: [] };
  }
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return { errors: ['DATABASE_URL is not configured'] };
  }
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('ROLLBACK');
    return { errors: [] };
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Rollback failed', rollbackError);
    }
    const message = error instanceof Error ? error.message : String(error);
    return { errors: [message] };
  } finally {
    await client.end();
  }
}
