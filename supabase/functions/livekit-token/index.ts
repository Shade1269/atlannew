import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { AccessToken } from "https://esm.sh/livekit-server-sdk@2.6.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LIVEKIT_API_KEY = Deno.env.get('LIVEKIT_API_KEY');
    const LIVEKIT_API_SECRET = Deno.env.get('LIVEKIT_API_SECRET');
    const LIVEKIT_URL = Deno.env.get('LIVEKIT_URL');

    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
      throw new Error('LiveKit credentials not configured');
    }

    const { roomName, participantName, participantIdentity, role } = await req.json();

    if (!roomName || !participantName || !participantIdentity) {
      throw new Error('Missing required fields: roomName, participantName, participantIdentity');
    }

    const isSpeaker = role === 'speaker';

    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participantIdentity,
      name: participantName,
    });

    token.addGrant({
      room: roomName,
      roomJoin: true,
      roomCreate: true,
      canPublish: isSpeaker,
      canSubscribe: true,
      canPublishData: isSpeaker,
    });

    const jwt = await token.toJwt();

    console.log(`Token generated for ${participantName} (${role}) in room ${roomName}`);

    return new Response(JSON.stringify({ 
      token: jwt,
      url: LIVEKIT_URL,
      role: role || 'listener'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error generating token:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
