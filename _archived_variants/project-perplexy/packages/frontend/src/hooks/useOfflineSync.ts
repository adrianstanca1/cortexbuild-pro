/**
 * Offline Sync Hook
 * Manages offline queue and background sync
 */

import { useState, useEffect, useCallback } from 'react'
import { fieldService } from '../services/fieldService'

interface OfflineQueueItem {
  id: string
  timestamp: string
  url: string
  method: string
  headers: Record<string, string>
  body?: any
}

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [queueLength, setQueueLength] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  const updateQueueLength = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready
      const channel = new MessageChannel()
      
      channel.port1.onmessage = (event) => {
        setQueueLength(event.data.queue?.length || 0)
      }

      registration.active?.postMessage(
        { type: 'GET_QUEUE' },
        [channel.port2]
      )
    }
  }, [])

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check for service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data.type === 'SYNC_COMPLETE') {
            setIsSyncing(false)
            updateQueueLength()
          }
        })
      })
    }

    updateQueueLength()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [updateQueueLength])

  const queueRequest = useCallback(async (item: Omit<OfflineQueueItem, 'id' | 'timestamp'>) => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready
      const channel = new MessageChannel()

      return new Promise((resolve) => {
        channel.port1.onmessage = (event) => {
          if (event.data.success) {
            updateQueueLength()
            resolve(true)
          }
        }

        registration.active?.postMessage(
          {
            type: 'QUEUE_REQUEST',
            item,
          },
          [channel.port2]
        )
      })
    }
  }, [updateQueueLength])

  const triggerSync = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      return
    }

    setIsSyncing(true)
    const registration = await navigator.serviceWorker.ready
    const channel = new MessageChannel()

    channel.port1.onmessage = (event) => {
      if (event.data.success) {
        // Sync registered, will complete in background
      }
    }

    registration.active?.postMessage(
      { type: 'TRIGGER_SYNC' },
      [channel.port2]
    )

    // Also try direct sync if online
    if (isOnline) {
      try {
        await fieldService.syncOfflineData()
        setIsSyncing(false)
        updateQueueLength()
      } catch (error) {
        console.error('Direct sync failed:', error)
      }
    }
  }, [isOnline, updateQueueLength])

  return {
    isOnline,
    queueLength,
    isSyncing,
    queueRequest,
    triggerSync,
    updateQueueLength,
  }
}

