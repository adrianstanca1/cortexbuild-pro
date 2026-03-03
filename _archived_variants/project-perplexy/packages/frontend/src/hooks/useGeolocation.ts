/**
 * Geolocation Hook
 * GPS-enhanced location services for field operations
 */

import { useState, useEffect, useCallback } from 'react'

interface Position {
  latitude: number
  longitude: number
  accuracy?: number
  altitude?: number | null
  altitudeAccuracy?: number | null
  heading?: number | null
  speed?: number | null
  timestamp: number
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
  watch?: boolean
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
    watch = false,
  } = options

  const [position, setPosition] = useState<Position | null>(null)
  const [error, setError] = useState<GeolocationPositionError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const updatePosition = useCallback((pos: GeolocationPosition) => {
    setPosition({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      altitude: pos.coords.altitude,
      altitudeAccuracy: pos.coords.altitudeAccuracy,
      heading: pos.coords.heading,
      speed: pos.coords.speed,
      timestamp: pos.timestamp,
    })
    setError(null)
    setIsLoading(false)
  }, [])

  const handleError = useCallback((err: GeolocationPositionError) => {
    setError(err)
    setIsLoading(false)
  }, [])

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError({
        code: 0,
        message: 'Geolocation is not supported',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError)
      return
    }

    setIsLoading(true)
    navigator.geolocation.getCurrentPosition(
      updatePosition,
      handleError,
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    )
  }, [enableHighAccuracy, timeout, maximumAge, updatePosition, handleError])

  useEffect(() => {
    if (watch) {
      if (!navigator.geolocation) {
        setError({
          code: 0,
          message: 'Geolocation is not supported',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        } as GeolocationPositionError)
        return
      }

      setIsLoading(true)
      const watchId = navigator.geolocation.watchPosition(
        updatePosition,
        handleError,
        {
          enableHighAccuracy,
          timeout,
          maximumAge,
        }
      )

      return () => {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [watch, enableHighAccuracy, timeout, maximumAge, updatePosition, handleError])

  return {
    position,
    error,
    isLoading,
    getCurrentPosition,
  }
}
