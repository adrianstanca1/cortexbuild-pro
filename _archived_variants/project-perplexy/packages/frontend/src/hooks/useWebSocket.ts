import { useEffect, useRef, useState, useCallback } from 'react'

// Get WebSocket URL at runtime (for Docker/nginx proxying support)
// If VITE_WS_URL is explicitly set to empty string, construct from window.location
// Otherwise, use the provided URL or default to localhost for development
const getWebSocketUrl = (): string => {
  // Check if VITE_WS_URL is explicitly set to empty string (for Docker)
  const wsUrl = import.meta.env.VITE_WS_URL
  if (wsUrl === '') {
    // Use relative URL - construct from current location at runtime
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      return `${protocol}//${window.location.host}/ws`
    }
  }
  return wsUrl || 'ws://localhost:3001/ws'
}

interface WebSocketMessage {
  type: string
  [key: string]: any
}

interface UseWebSocketOptions {
  projectId?: string
  onMessage?: (message: WebSocketMessage) => void
  onError?: (error: Error) => void
  onConnect?: () => void
  onDisconnect?: () => void
  reconnect?: boolean
  reconnectInterval?: number
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    projectId,
    onMessage,
    onError,
    onConnect,
    onDisconnect,
    reconnect = true,
    reconnectInterval = 3000,
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const shouldReconnectRef = useRef(true)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      // Get WebSocket URL at runtime (in case it needs window.location)
      const wsUrl = getWebSocketUrl()
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        setError(null)
        shouldReconnectRef.current = true

        // Subscribe to project updates if projectId is provided
        if (projectId) {
          ws.send(
            JSON.stringify({
              type: 'subscribe',
              projectId,
            })
          )
        }

        onConnect?.()
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          onMessage?.(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      ws.onerror = (event) => {
        console.error('WebSocket error:', event)
        const error = new Error('WebSocket connection error')
        setError(error)
        onError?.(error)
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected')
        setIsConnected(false)
        wsRef.current = null

        onDisconnect?.()

        // Attempt to reconnect
        if (reconnect && shouldReconnectRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, reconnectInterval)
        }
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      const err = error instanceof Error ? error : new Error('WebSocket connection failed')
      setError(err)
      onError?.(err)
    }
  }, [projectId, onMessage, onError, onConnect, onDisconnect, reconnect, reconnectInterval])

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
  }, [])

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
      return true
    }
    return false
  }, [])

  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  // Update subscription when projectId changes
  useEffect(() => {
    if (isConnected && projectId && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'subscribe',
          projectId,
        })
      )
    }
  }, [projectId, isConnected])

  return {
    isConnected,
    error,
    sendMessage,
    connect,
    disconnect,
  }
}

