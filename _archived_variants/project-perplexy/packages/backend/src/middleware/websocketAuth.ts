import { WebSocket } from 'ws'
import { verifyToken } from '../config/auth.js'
import logger from '../config/logger.js'

/**
 * WebSocket authentication middleware
 * Validates JWT tokens for WebSocket connections
 */
export const authenticateWebSocket = (ws: WebSocket, request: any) => {
  try {
    // Extract token from query parameters or headers
    const url = new URL(request.url, 'http://localhost')
    const protocolHeader = request.headers.sec_websocket_protocol
    const negotiatedProtocol = protocolHeader
      ?.split(',')
      .map((t: string) => t.trim())
      .find((token: string) => token.length > 0)

    const token =
      url.searchParams.get('token') ||
      request.headers.authorization?.replace('Bearer ', '') ||
      negotiatedProtocol

    if (!token) {
      logger.warn('WebSocket connection rejected: No token provided')
      ws.close(1008, 'Authentication required')
      return false
    }

    try {
      // Verify the JWT token
      const decoded = verifyToken(token) as { userId: string; email: string; role: string }
      
      // Attach user info to the WebSocket connection
      (ws as any).user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role
      }

      logger.info(`WebSocket authenticated for user: ${decoded.email}`)
      return true
    } catch (error) {
      logger.warn('WebSocket connection rejected: Invalid token', { error })
      ws.close(1008, 'Invalid token')
      return false
    }
  } catch (error) {
    logger.error('WebSocket authentication error:', { error })
    ws.close(1011, 'Authentication error')
    return false
  }
}

/**
 * Rate limiting for WebSocket connections
 */
const connectionAttempts = new Map<string, { count: number; lastAttempt: number }>()
const MAX_CONNECTIONS_PER_MINUTE = 10
const WINDOW_MS = 60 * 1000 // 1 minute

export const rateLimitWebSocket = (ws: WebSocket, request: any): boolean => {
  const clientIp = request.socket.remoteAddress || 'unknown'
  const now = Date.now()
  
  const attempts = connectionAttempts.get(clientIp) || { count: 0, lastAttempt: 0 }
  
  // Reset if window has passed
  if (now - attempts.lastAttempt > WINDOW_MS) {
    attempts.count = 0
    attempts.lastAttempt = now
  }
  
  attempts.count++
  attempts.lastAttempt = now
  connectionAttempts.set(clientIp, attempts)
  
  if (attempts.count > MAX_CONNECTIONS_PER_MINUTE) {
    logger.warn(`WebSocket rate limit exceeded for IP: ${clientIp}`)
    ws.close(1008, 'Rate limit exceeded')
    return false
  }
  
  return true
}

/**
 * Enhanced WebSocket security middleware
 */
export const websocketSecurityMiddleware = (ws: WebSocket, request: any) => {
  // Rate limiting
  if (!rateLimitWebSocket(ws, request)) {
    return false
  }
  
  // Authentication
  if (!authenticateWebSocket(ws, request)) {
    return false
  }
  
  // Set security headers
  ws.send(JSON.stringify({
    type: 'security_check',
    message: 'Connection secured',
    userId: (ws as any).user?.userId
  }))
  
  return true
}

export default {
  authenticateWebSocket,
  rateLimitWebSocket,
  websocketSecurityMiddleware
}
