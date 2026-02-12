import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const expectedKey = Deno.env.get('MCP_API_KEY');
    const url = new URL(req.url);
    
    // Get API key from multiple sources
    const apiKeyFromQuery = url.searchParams.get('api_key');
    const apiKeyFromHeader = req.headers.get('x-api-key');
    const authHeader = req.headers.get('authorization');
    let apiKeyFromBearer = null;
    
    if (authHeader?.startsWith('Bearer ')) {
      apiKeyFromBearer = authHeader.substring(7);
    }
    
    // For POST requests, check body for API key
    let bodyText = '';
    let apiKeyFromBody = null;
    
    if (req.method === 'POST') {
      bodyText = await req.text();
      if (bodyText) {
        try {
          const body = JSON.parse(bodyText);
          apiKeyFromBody = body.api_key;
        } catch (e) {
          // Not JSON, ignore
        }
      }
    }
    
    // Check if any API key matches
    const providedKey = apiKeyFromQuery || apiKeyFromHeader || apiKeyFromBearer || apiKeyFromBody;
    
    if (!providedKey || providedKey !== expectedKey) {
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized: Invalid or missing API key',
          hint: 'Provide API key via: ?api_key=xxx, x-api-key header, Authorization: Bearer xxx, or in body as api_key',
          methods: {
            GET: 'Get API information and available actions',
            POST: 'Execute database operations'
          }
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle GET requests - return API documentation
    if (req.method === 'GET') {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'MCP Full Access API - Authenticated',
          version: '1.0',
          available_actions: [
            'select - Read data from table',
            'insert - Insert new data',
            'update - Update existing data',
            'delete - Delete data',
            'list_tables - List all tables',
            'describe_table - Describe table structure'
          ],
          example_request: {
            method: 'POST',
            body: {
              action: 'select',
              table: 'affiliate_stores',
              filters: { is_active: true }
            }
          },
          tables: [
            'affiliate_stores',
            'affiliate_products',
            'products',
            'profiles',
            'commissions',
            'ecommerce_orders'
          ]
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body (reuse bodyText if already read)
    if (!bodyText) {
      bodyText = await req.text();
    }
    
    if (!bodyText) {
      return new Response(
        JSON.stringify({ 
          error: 'Bad Request: Empty body',
          hint: 'POST requests must include a JSON body with action and other parameters'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const requestData = JSON.parse(bodyText);
    const { action, table, data, filters, query, columns } = requestData;

    let result;

    switch (action) {
      case 'select': {
        // قراءة بيانات من جدول
        let queryBuilder = supabase.from(table).select(columns || '*');
        
        // تطبيق الفلاتر
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            queryBuilder = queryBuilder.eq(key, value);
          });
        }
        
        result = await queryBuilder;
        break;
      }

      case 'insert': {
        // إضافة بيانات جديدة
        result = await supabase.from(table).insert(data).select();
        break;
      }

      case 'update': {
        // تعديل بيانات
        let queryBuilder = supabase.from(table).update(data);
        
        // تطبيق الفلاتر
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            queryBuilder = queryBuilder.eq(key, value);
          });
        }
        
        result = await queryBuilder.select();
        break;
      }

      case 'delete': {
        // حذف بيانات
        let queryBuilder = supabase.from(table).delete();
        
        // تطبيق الفلاتر
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            queryBuilder = queryBuilder.eq(key, value);
          });
        }
        
        result = await queryBuilder;
        break;
      }

      case 'raw_query': {
        // تنفيذ استعلام SQL مخصص (خطير جداً!)
        result = await supabase.rpc('exec_sql', { query_text: query });
        break;
      }

      case 'list_tables': {
        // عرض جميع الجداول
        const { data, error } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public');
        
        result = { data, error };
        break;
      }

      case 'describe_table': {
        // وصف جدول (الأعمدة والأنواع)
        const { data, error } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable')
          .eq('table_schema', 'public')
          .eq('table_name', table);
        
        result = { data, error };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use: select, insert, update, delete, raw_query, list_tables, describe_table' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    if (result.error) {
      console.error('Database error:', result.error);
      return new Response(
        JSON.stringify({ error: result.error.message, details: result.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: result.data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
