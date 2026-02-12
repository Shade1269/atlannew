import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

interface ActivityConnection {
  userId: string
  socket: WebSocket
  lastSeen: Date
  subscriptions: Set<string>
}

const connections = new Map<string, ActivityConnection>()

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    if (req.headers.get("upgrade") === "websocket") {
      const { socket, response } = Deno.upgradeWebSocket(req)
      let userId: string | null = null

      socket.onopen = () => {
        console.log("📊 Activity feed WebSocket opened")
      }

      socket.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === 'auth') {
            userId = data.userId
            const subscriptions = new Set<string>(data.subscriptions || ['all'])
            
            if (userId) {
              connections.set(userId, {
                userId,
                socket,
                lastSeen: new Date(),
                subscriptions
              })
              
              socket.send(JSON.stringify({
                type: 'auth_success',
                message: 'Connected to activity feed',
                subscriptions: Array.from(subscriptions)
              }))
            }
          }
          else if (data.type === 'ping') {
            if (userId && connections.has(userId)) {
              connections.get(userId)!.lastSeen = new Date()
            }
            socket.send(JSON.stringify({ type: 'pong' }))
          }
        } catch (error) {
          console.error("❌ Error processing activity message:", error)
        }
      }

      socket.onclose = () => {
        if (userId) {
          connections.delete(userId)
          console.log(`👋 Activity user ${userId} disconnected`)
        }
      }

      return response
    }

    if (req.method === 'POST') {
      const body = await req.json()
      const { activityType, userId: actorId, description, broadcast = false } = body

      const activityMessage = {
        type: 'activity',
        data: {
          id: crypto.randomUUID(),
          activityType,
          actorId,
          description,
          timestamp: new Date().toISOString()
        }
      }

      let sentCount = 0

      if (broadcast) {
        for (const [connUserId, conn] of connections) {
          if (conn.subscriptions.has('all') || conn.subscriptions.has(activityType)) {
            try {
              conn.socket.send(JSON.stringify(activityMessage))
              sentCount++
            } catch (error) {
              console.error(`❌ Error sending activity to user ${connUserId}:`, error)
              connections.delete(connUserId)
            }
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true, sent: sentCount }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error("❌ Activity server error:", error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})