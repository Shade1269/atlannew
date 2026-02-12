import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Firebase config from Supabase secrets
const FIREBASE_PROJECT_ID = Deno.env.get('FIREBASE_PROJECT_ID')!;
const FIREBASE_API_KEY = Deno.env.get('FIREBASE_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Firebase Firestore REST API functions
const getFirebaseAccessToken = async () => {
  // Use Firebase Auth to get access token for Firestore API
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@system.local', // Service account email
      password: 'service-migration-2024',
      returnSecureToken: true
    })
  });
  
  if (!response.ok) {
    // For migration purposes, we'll use the API key directly
    return null;
  }
  
  const data = await response.json();
  return data.idToken;
};

const saveToFirestore = async (collection: string, docId: string, data: any, subcollection?: string, subdocId?: string) => {
  try {
    let url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${collection}/${docId}`;
    
    if (subcollection && subdocId) {
      url += `/${subcollection}/${subdocId}`;
    }
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIREBASE_API_KEY}`, // Use API key for service operations
      },
      body: JSON.stringify({
        fields: convertToFirestoreFields(data)
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Firestore save error:', error);
      throw new Error(`Firestore error: ${response.status} ${error}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving to Firestore:', error);
    throw error;
  }
};

const convertToFirestoreFields = (obj: any): any => {
  const fields: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      fields[key] = { nullValue: null };
    } else if (typeof value === 'string') {
      fields[key] = { stringValue: value };
    } else if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        fields[key] = { integerValue: value.toString() };
      } else {
        fields[key] = { doubleValue: value };
      }
    } else if (typeof value === 'boolean') {
      fields[key] = { booleanValue: value };
    } else if (value instanceof Date) {
      fields[key] = { timestampValue: value.toISOString() };
    } else if (Array.isArray(value)) {
      fields[key] = {
        arrayValue: {
          values: value.map(item => {
            if (typeof item === 'string') return { stringValue: item };
            if (typeof item === 'number') return Number.isInteger(item) ? { integerValue: item.toString() } : { doubleValue: item };
            if (typeof item === 'boolean') return { booleanValue: item };
            return { stringValue: JSON.stringify(item) };
          })
        }
      };
    } else if (typeof value === 'object') {
      fields[key] = { mapValue: { fields: convertToFirestoreFields(value) } };
    } else {
      fields[key] = { stringValue: String(value) };
    }
  }
  
  return fields;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const requestBody = await req.json().catch(() => ({}));
    
    if (requestBody.action === 'get_data_only') {
      console.log('Fetching data from Supabase for migration...');
      
      const result = {
        success: true,
        profiles: [] as any[],
        shops: [] as any[],
        products: [] as any[],
        activities: [] as any[]
      };

      try {
        // Get profiles
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (!profilesError && profiles) {
          result.profiles = profiles;
        }

        // Get shops
        const { data: shops, error: shopsError } = await supabase
          .from('shops')
          .select(`
            *,
            profiles!shops_owner_id_fkey (auth_user_id),
            shop_settings_extended (*)
          `)
          .order('created_at', { ascending: false });
        
        if (!shopsError && shops) {
          result.shops = shops;
        }

        // Get products
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select(`
            *,
            merchants (profile_id, profiles (auth_user_id)),
            product_variants (*)
          `)
          .order('created_at', { ascending: false });
        
        if (!productsError && products) {
          result.products = products;
        }

        console.log(`Found ${result.profiles.length} profiles, ${result.shops.length} shops, ${result.products.length} products`);
        
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
        
      } catch (error) {
        console.error('Error fetching data:', error);
        return new Response(JSON.stringify({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error occurred' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Default response for backward compatibility
    return new Response(JSON.stringify({ 
      success: true,
      message: "Use action: 'get_data_only' to fetch migration data",
      results: {
        users: { success: false, count: 0, total: 0 },
        shops: { success: false, count: 0, total: 0 },
        products: { success: false, count: 0, total: 0 },
        activities: { success: false, count: 0, total: 0 }
      },
      totalMigrated: 0,
      totalItems: 0
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in migrate-supabase-to-firestore:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});