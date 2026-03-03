import fetch from 'node-fetch'
import { Coordinates, MapView } from '../types/location.js'
import { ApiError } from '../utils/ApiError.js'
import logger from '../config/logger.js'

/**
 * Service for generating real-world map views based on GPS coordinates
 */
export const mapService = {
  /**
   * Generate real-world map view from coordinates
   */
  async generateRealWorldMap(
    center: Coordinates,
    zoom: number = 15
  ): Promise<MapView> {
    // Calculate bounds for the map view
    const bounds = this.calculateBounds(center, zoom)

    return {
      type: 'real',
      center,
      zoom,
      bounds,
    }
  },

  /**
   * Calculate map bounds from center and zoom level
   */
  calculateBounds(center: Coordinates, zoom: number): {
    north: number
    south: number
    east: number
    west: number
  } {
    // Approximate calculation (degrees per pixel varies by zoom)
    const degreesPerPixel = 360 / (256 * Math.pow(2, zoom))
    const pixels = 640 // Approximate viewport size
    const degrees = (degreesPerPixel * pixels) / 2

    return {
      north: center.lat + degrees,
      south: center.lat - degrees,
      east: center.lng + degrees,
      west: center.lng - degrees,
    }
  },

  /**
   * Get map tile URL for OpenStreetMap
   */
  getMapTileUrl(x: number, y: number, z: number): string {
    return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`
  },

  /**
   * Get Google Maps static image URL
   */
  getGoogleMapsStaticUrl(
    center: Coordinates,
    zoom: number,
    size: string = '640x640',
    markers?: Array<{ lat: number; lng: number; color: string; label: string }>
  ): string {
    const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap'
    const params = new URLSearchParams({
      center: `${center.lat},${center.lng}`,
      zoom: zoom.toString(),
      size,
      maptype: 'satellite',
    })

    if (markers) {
      markers.forEach((marker) => {
        params.append(
          'markers',
          `color:${marker.color}|label:${marker.label}|${marker.lat},${marker.lng}`
        )
      })
    }

    return `${baseUrl}?${params.toString()}`
  },

  /**
   * Reverse geocoding (get address from coordinates)
   */
  async reverseGeocode(coordinates: Coordinates): Promise<string> {
    // Using OpenStreetMap Nominatim API (free, no key required)
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordinates.lat}&lon=${coordinates.lng}`
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'CodeInterpreterApp/1.0',
        },
      })
      const data = await response.json() as any
      return data.display_name || 'Unknown location'
    } catch (error) {
      logger.error('Reverse geocoding error', { error: error instanceof Error ? error.message : String(error) })
      return 'Unknown location'
    }
  },

  /**
   * Get bounding box for a set of coordinates
   */
  getBoundingBox(coordinates: Coordinates[]): {
    north: number
    south: number
    east: number
    west: number
  } {
    if (coordinates.length === 0) {
      throw new ApiError('No coordinates provided', 400)
    }

    let north = coordinates[0].lat
    let south = coordinates[0].lat
    let east = coordinates[0].lng
    let west = coordinates[0].lng

    for (const coord of coordinates) {
      north = Math.max(north, coord.lat)
      south = Math.min(south, coord.lat)
      east = Math.max(east, coord.lng)
      west = Math.min(west, coord.lng)
    }

    return { north, south, east, west }
  },
}

