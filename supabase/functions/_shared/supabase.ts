/**
 * Shared Supabase Client for Edge Functions
 * 
 * Centralizes Supabase client creation to reduce duplicate code.
 * Uses service role key for admin operations.
 * 
 * @example
 * ```ts
 * import { getSupabaseClient, getSupabaseAdminClient } from '../_shared/supabase.ts';
 * 
 * // For user-scoped operations (respects RLS)
 * const supabase = getSupabaseClient(req);
 * 
 * // For admin operations (bypasses RLS)
 * const supabaseAdmin = getSupabaseAdminClient();
 * ```
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

// Cache for admin client (singleton pattern)
let adminClient: SupabaseClient | null = null;

/**
 * Get Supabase admin client (service role - bypasses RLS)
 * Uses singleton pattern to reuse connections.
 */
export function getSupabaseAdminClient(): SupabaseClient {
    if (adminClient) return adminClient;

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
    }

    adminClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });

    return adminClient;
}

/**
 * Get Supabase client with user's JWT token (respects RLS)
 * Use this for user-scoped operations.
 * 
 * @param req - Incoming request with Authorization header
 */
export function getSupabaseClient(req: Request): SupabaseClient {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
    }

    const authHeader = req.headers.get('Authorization');

    return createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: authHeader ? { Authorization: authHeader } : {},
        },
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}

/**
 * Extract user ID from JWT token in request
 * Returns null if not authenticated
 */
export async function getUserIdFromRequest(req: Request): Promise<string | null> {
    try {
        const supabase = getSupabaseClient(req);
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) return null;
        return user.id;
    } catch {
        return null;
    }
}

/**
 * Validate that request has valid authentication
 * @returns User object if authenticated, throws error otherwise
 */
export async function requireAuth(req: Request): Promise<{ id: string; email?: string }> {
    const supabase = getSupabaseClient(req);
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        throw new Error('غير مصرح لك بالوصول');
    }

    return { id: user.id, email: user.email };
}

// Re-export createClient for advanced use cases
export { createClient };
