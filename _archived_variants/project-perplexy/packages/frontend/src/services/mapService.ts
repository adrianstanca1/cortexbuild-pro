import axios from 'axios'

// Use relative URL when VITE_API_URL is empty (for Docker/nginx proxying)
// If VITE_API_URL is explicitly set to empty string, use relative URLs
// Otherwise, default to localhost for development
const API_URL = import.meta.env.VITE_API_URL === '' ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3001')

export interface Coordinates {
  lat: number
  lng: number
}

export interface DrawingMap {
  projectId: string
  drawingFile: string
  layoutData: LayoutData
  createdAt: Date
  mapImage?: string
}

export interface LayoutData {
  zones?: Zone[]
  boundaries?: Boundary[]
  buildings?: Building[]
  coordinates?: Coordinates[]
  metadata?: {
    scale?: number
    units?: string
    orientation?: number
  }
}

export interface Zone {
  id: string
  name: string
  coordinates: Coordinates[]
  type?: string
}

export interface Boundary {
  coordinates: Coordinates[]
  type: 'fence' | 'building' | 'area'
}

export interface Building {
  id: string
  name: string
  coordinates: Coordinates[]
  floor?: number
}

export interface MapView {
  type: 'virtual' | 'real'
  center: Coordinates
  zoom: number
  bounds?: {
    north: number
    south: number
    east: number
    west: number
  }
}

export const mapService = {
  /**
   * Upload drawing PDF
   */
  async uploadDrawing(file: File, projectId: string): Promise<DrawingMap> {
    const formData = new FormData()
    formData.append('drawing', file)
    formData.append('projectId', projectId)

    const response = await axios.post(`${API_URL}/api/maps/upload-drawing`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data.drawingMap
  },

  /**
   * Get drawing map by project ID
   */
  async getDrawingMap(projectId: string): Promise<DrawingMap> {
    const response = await axios.get(`${API_URL}/api/maps/drawing/${projectId}`)
    return response.data.drawingMap
  },

  /**
   * Get all drawing maps
   */
  async getAllDrawingMaps(): Promise<DrawingMap[]> {
    const response = await axios.get(`${API_URL}/api/maps/drawings`)
    return response.data.drawingMaps
  },

  /**
   * Delete drawing map
   */
  async deleteDrawingMap(projectId: string): Promise<void> {
    await axios.delete(`${API_URL}/api/maps/drawing/${projectId}`)
  },

  /**
   * Generate real-world map view
   */
  async generateRealWorldMap(
    center: Coordinates,
    zoom: number = 15
  ): Promise<MapView> {
    const response = await axios.post(`${API_URL}/api/maps/generate-real-map`, {
      center,
      zoom,
    })
    return response.data.mapView
  },

  /**
   * Reverse geocode coordinates
   */
  async reverseGeocode(coordinates: Coordinates): Promise<string> {
    const response = await axios.post(`${API_URL}/api/maps/reverse-geocode`, {
      center: coordinates,
    })
    return response.data.address
  },
}

