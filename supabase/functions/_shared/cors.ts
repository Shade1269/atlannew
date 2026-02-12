/**
 * ✅ CORS Configuration - للتطوير والإنتاج
 */

// قائمة النطاقات المسموح بها
const ALLOWED_ORIGINS = [
  'https://sawal-shamel.lovable.app',
  'http://localhost:8080',
  'http://localhost:5173',
  'http://localhost:3000',
  'https://atl-mu.vercel.app/',
  'https://atlantiss.tech/',
  


  
];

/**
 * التحقق إذا كان origin مسموح
 */
function isAllowedOrigin(origin: string): boolean {
  if (!origin) return true; // السماح للطلبات بدون origin
  
  // السماح لكل نطاقات lovable
  if (origin.includes('lovable')) {
    return true;
  }
  
  // السماح لـ localhost
  if (origin.includes('localhost')) {
    return true;
  }
  
  // السماح للنطاقات في القائمة
  return ALLOWED_ORIGINS.includes(origin);
}

/**
 * الحصول على CORS headers
 */
export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin') || '*';

  return {
    'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? origin : '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
    'Access-Control-Allow-Credentials': 'true',
  };
}

/**
 * معالجة OPTIONS request (preflight)
 */
export function handleCorsPreflightRequest(request: Request): Response {
  return new Response(null, {
    headers: getCorsHeaders(request),
    status: 204
  });
}

/**
 * إضافة CORS headers إلى Response
 */
export function addCorsHeaders(response: Response, request: Request): Response {
  const headers = new Headers(response.headers);
  const corsHeaders = getCorsHeaders(request);

  Object.entries(corsHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
