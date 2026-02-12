import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

interface ChatConnection {
  userId: string
  username: string
  socket: WebSocket
  roomId?: string
  lastSeen: Date
}

const connections = new Map<string, ChatConnection>()
const rooms = new Map<string, Set<string>>()

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
        console.log("💬 Live chat WebSocket opened")
      }

      socket.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === 'auth') {
            userId = data.userId
            const username = data.username || `User_${userId?.slice(-6)}`
            
            if (userId) {
              connections.set(userId, {
                userId,
                username,
                socket,
                lastSeen: new Date()
              })
              
              socket.send(JSON.stringify({
                type: 'auth_success',
                message: 'Connected to live chat',
                userId,
                username
              }))
            }
          } 
          else if (data.type === 'join_room') {
            const { roomId } = data
            if (userId && roomId) {
              const connection = connections.get(userId)
              if (connection) {
                connection.roomId = roomId
                if (!rooms.has(roomId)) {
                  rooms.set(roomId, new Set())
                }
                rooms.get(roomId)!.add(userId)

                broadcastToRoom(roomId, {
                  type: 'user_joined',
                  userId,
                  username: connection.username,
                  timestamp: new Date().toISOString()
                }, userId)
              }
            }
          }
          else if (data.type === 'chat_message') {
            const { message, roomId } = data
            const connection = connections.get(userId!)
            
            if (connection && roomId) {
              const chatMessage = {
                type: 'chat_message',
                messageId: crypto.randomUUID(),
                userId,
                username: connection.username,
                message,
                roomId,
                timestamp: new Date().toISOString()
              }

              broadcastToRoom(roomId, chatMessage)
            }
          }
        } catch (error) {
          console.error("❌ Error processing chat message:", error)
        }
      }

      socket.onclose = () => {
        if (userId) {
          const connection = connections.get(userId)
          if (connection?.roomId) {
            const room = rooms.get(connection.roomId)
            if (room) {
              room.delete(userId)
              broadcastToRoom(connection.roomId, {
                type: 'user_left',
                userId,
                username: connection.username,
                timestamp: new Date().toISOString()
              }, userId)
            }
          }
          connections.delete(userId)
        }
      }

      return response
    }

    return new Response(
      JSON.stringify({ error: 'WebSocket upgrade required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error("❌ Chat server error:", error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function broadcastToRoom(roomId: string, message: any, excludeUserId?: string) {
  const room = rooms.get(roomId)
  if (!room) return

  for (const userId of room) {
    if (excludeUserId && userId === excludeUserId) continue
    
    const connection = connections.get(userId)
    if (connection) {
      try {
        connection.socket.send(JSON.stringify(message))
      } catch (error) {
        console.error(`❌ Error sending to user ${userId}:`, error)
        connections.delete(userId)
        room.delete(userId)
      }
    }
  }
}