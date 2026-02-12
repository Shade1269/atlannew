import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

interface GeideaSessionRequest {
  amount: number;
  currency: string;
  orderId: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  callbackUrl: string;
  webhookUrl?: string;
  merchantReferenceId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const MERCHANT_PUBLIC_KEY = (Deno.env.get('GEIDEA_MERCHANT_PUBLIC_KEY') || '').trim();
    const API_PASSWORD = (Deno.env.get('GEIDEA_API_PASSWORD') || '').trim();

    if (!MERCHANT_PUBLIC_KEY || !API_PASSWORD) {
      throw new Error('Geidea credentials not configured');
    }

    const requestData: GeideaSessionRequest = await req.json();

    console.log('Creating Geidea session for order:', requestData.orderId);

    // Generate timestamp
    const timestamp = new Date().toISOString();

    // Generate signature using HMAC-SHA256
    const amountStr = requestData.amount.toFixed(2);
    const signatureString = `${MERCHANT_PUBLIC_KEY}${amountStr}${requestData.currency}${requestData.merchantReferenceId}${timestamp}`;

    const encoder = new TextEncoder();
    const keyData = encoder.encode(API_PASSWORD);
    const messageData = encoder.encode(signatureString);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const signature = btoa(String.fromCharCode(...signatureArray));

    // Create Basic Authentication header
    const authString = `${MERCHANT_PUBLIC_KEY}:${API_PASSWORD}`;
    const encodedAuth = btoa(authString);

    // Prepare Geidea API payload with Apple Pay support
    const geideaPayload = {
      amount: requestData.amount,
      currency: requestData.currency,
      merchantReferenceId: requestData.merchantReferenceId,
      timestamp: timestamp,
      signature: signature,
      callbackUrl: requestData.callbackUrl,
      billingAddress: {
        countryCode: 'SAU',
      },
      customerEmail: requestData.customerEmail || '',
      paymentOperation: 'Pay',
      initiatedBy: 'Internet',
      paymentMethods: ['Card', 'ApplePay']
    };

    console.log('Calling Geidea API with payload:', JSON.stringify(geideaPayload, null, 2));

    const endpoints = [
      'https://api.ksamerchant.geidea.net',
      'https://api.merchant.geidea.net',
      'https://api.geidea.ae'
    ];

    let geideaResponse: Response | null = null;
    let geideaData: any = null;
    let lastError: any = null;

    for (const base of endpoints) {
      const url = `${base}/payment-intent/api/v2/direct/session`;
      console.log('Trying Geidea endpoint:', url);
      geideaResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Basic ${encodedAuth}`,
        },
        body: JSON.stringify(geideaPayload),
      });

      geideaData = await geideaResponse.json().catch(() => null);
      console.log('Geidea API response status:', geideaResponse.status);
      console.log('Geidea API full response:', JSON.stringify(geideaData, null, 2));

      if (geideaResponse.ok && geideaData?.session?.id) {
        break;
      } else {
        console.error('Geidea API error on endpoint:', url, geideaData);
        lastError = geideaData;
      }
    }

    if (!geideaResponse || !geideaResponse.ok) {
      const msg = `${lastError?.responseMessage || 'Failed to create payment session'}${lastError?.detailedResponseCode ? ` [${lastError?.detailedResponseCode}] ${lastError?.detailedResponseMessage || ''}` : ''}`;
      throw new Error(msg);
    }

    // Return session data to frontend
    return new Response(
      JSON.stringify({
        success: true,
        sessionId: geideaData.session?.id,
        sessionData: geideaData,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error creating Geidea session:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
