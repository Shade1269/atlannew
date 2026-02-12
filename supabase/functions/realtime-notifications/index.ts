import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

interface WebSocketConnection {
  userId: string
  socket: WebSocket
  lastSeen: Date
}

const connections = new Map<string, WebSocketConnection>()

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    // Handle WebSocket upgrade
    if (req.headers.get("upgrade") === "websocket") {
      const { socket, response } = Deno.upgradeWebSocket(req)
      let userId: string | null = null

      socket.onopen = () => {
        console.log("🔗 Real-time notifications WebSocket opened")
      }

      socket.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log("📨 Received notification message:", data)

          if (data.type === 'auth') {
            userId = data.userId
            if (userId) {
              connections.set(userId, {
                userId,
                socket,
                lastSeen: new Date()
              })
              console.log(`✅ Notification user ${userId} authenticated`)
              
              socket.send(JSON.stringify({
                type: 'auth_success',
                message: 'Connected to notifications'
              }))
            }
          } else if (data.type === 'ping') {
            if (userId && connections.has(userId)) {
              connections.get(userId)!.lastSeen = new Date()
            }
            socket.send(JSON.stringify({ type: 'pong' }))
          }
        } catch (error) {
          console.error("❌ Error processing notification message:", error)
        }
      }

      socket.onclose = () => {
        if (userId) {
          connections.delete(userId)
          console.log(`👋 Notification user ${userId} disconnected`)
        }
      }

      return response
    }

    // Handle HTTP requests for sending notifications
    if (req.method === 'POST') {
      const body = await req.json()
      const { userId, notification, broadcast = false } = body

      if (broadcast) {
        // Send to all connected users
        let sentCount = 0
        for (const [connUserId, conn] of connections) {
          try {
            conn.socket.send(JSON.stringify({
              type: 'notification',
              data: notification,
              timestamp: new Date().toISOString()
            }))
            sentCount++
          } catch (error) {
            console.error(`❌ Error sending to user ${connUserId}:`, error)
            connections.delete(connUserId)
          }
        }

        return new Response(
          JSON.stringify({ success: true, sent: sentCount }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } else {
        // Send to specific user
        const connection = connections.get(userId)
        if (connection) {
          try {
            connection.socket.send(JSON.stringify({
              type: 'notification',
              data: notification,
              timestamp: new Date().toISOString()
            }))
            return new Response(
              JSON.stringify({ success: true }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          } catch (error) {
            connections.delete(userId)
            return new Response(
              JSON.stringify({ success: false, error: 'Connection failed' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
        }
        
        return new Response(
          JSON.stringify({ success: false, error: 'User not connected' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error("❌ Server error:", error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})