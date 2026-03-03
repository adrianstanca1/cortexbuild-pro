import { useEffect, useRef, useState } from 'react'
import { checkApiHealth, HealthStatus } from '../services/apiClient'

type ConnectivityState = 'checking' | 'online' | 'degraded' | 'offline'

export function useConnectivityStatus(pollIntervalMs = 15000) {
  const [state, setState] = useState<ConnectivityState>('checking')
  const [lastCheck, setLastCheck] = useState<HealthStatus | null>(null)
  const [lastError, setLastError] = useState<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    let isMounted = true

    const runCheck = async () => {
      try {
        const result = await checkApiHealth({ timeoutMs: 4000 })
        if (!isMounted) return
        setLastCheck(result)
        if (result.ok) {
          setState('online')
          setLastError(null)
        } else {
          setState('degraded')
          setLastError('Health endpoint responded with an error.')
        }
      } catch (error: any) {
        if (!isMounted) return
        setState('offline')
        setLastError(error?.message || 'Unable to contact API')
      }
      
      if (isMounted) {
        timeoutRef.current = setTimeout(runCheck, pollIntervalMs)
      }
    }

    runCheck()

    return () => {
      isMounted = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [pollIntervalMs])

  return {
    state,
    lastCheck,
    lastError,
    isApiReachable: state === 'online' || state === 'degraded',
  }
}

