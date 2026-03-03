import { WebSocketServer, WebSocket } from 'ws'
import { Server } from 'http'
import { ActiveUser } from '../types/location.js'
import { locationService } from './locationService.js'
import logger from '../config/logger.js'

interface ClientConnection {
  ws: WebSocket
  userId: string
  projectId?: string
}

let wss: WebSocketServer | null = null
const clients = new Map<string, ClientConnection>()

export const websocketService = {
  /**
   * Initialize WebSocket server
   */
  initialize(server: Server) {
    wss = new WebSocketServer({ server, path: '/ws' })

    wss.on('connection', (ws: WebSocket, _req) => {
      const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      logger.info('New WebSocket connection', { userId })

      const client: ClientConnection = {
        ws,
        userId,
      }

      clients.set(userId, client)

      // Send welcome message
      ws.send(
        JSON.stringify({
          type: 'connected',
          userId,
          message: 'Connected to location tracking service',
        })
      )

      // Handle messages
      ws.on('message', async (message: string) => {
        try {
          const data = JSON.parse(message.toString())

          switch (data.type) {
            case 'subscribe': {
              // Subscribe to project updates
              client.projectId = data.projectId
              // Send current active users
              const users = await locationService.getActiveUsers(data.projectId)
              ws.send(
                JSON.stringify({
                  type: 'active_users',
                  users: users.map((user) => ({
                    ...user,
                    color: locationService.getRoleColor(user.role),
                  })),
                })
              )
              break
            }

            case 'ping':
              // Heartbeat
              ws.send(JSON.stringify({ type: 'pong' }))
              break

            default:
              logger.warn('Unknown message type', { type: data.type })
          }
        } catch (error) {
          logger.error('WebSocket message error', { error: error instanceof Error ? error.message : String(error) })
        }
      })

      // Handle disconnect
      ws.on('close', () => {
        logger.info('WebSocket disconnected', { userId })
        clients.delete(userId)
      })

      // Handle errors
      ws.on('error', (error) => {
        logger.error('WebSocket error', { userId, error: error.message })
        clients.delete(userId)
      })
    })

    // Broadcast location updates every 5 seconds
    setInterval(async () => {
      if (wss && clients.size > 0) {
        const projectIds = new Set<string>()
        
        // Collect all project IDs
        clients.forEach((client) => {
          if (client.projectId) {
            projectIds.add(client.projectId)
          }
        })

        // Broadcast updates for each project
        for (const projectId of projectIds) {
          const users = await locationService.getActiveUsers(projectId)
          const message = JSON.stringify({
            type: 'location_update',
            users: users.map((user) => ({
              ...user,
              color: locationService.getRoleColor(user.role),
            })),
          })

          // Send to all clients subscribed to this project
          clients.forEach((client) => {
            if (client.projectId === projectId && client.ws.readyState === WebSocket.OPEN) {
              client.ws.send(message)
            }
          })
        }
      }
    }, 5000) // Every 5 seconds

    logger.info('WebSocket server initialized')
  },

  /**
   * Broadcast location update to all clients
   */
  broadcastLocationUpdate(projectId: string, users: ActiveUser[]) {
    if (!wss) return

    const message = JSON.stringify({
      type: 'location_update',
      users: users.map((user) => ({
        ...user,
        color: locationService.getRoleColor(user.role),
      })),
    })

    clients.forEach((client) => {
      if (client.projectId === projectId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message)
      }
    })
  },

  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    return clients.size
  },
}

