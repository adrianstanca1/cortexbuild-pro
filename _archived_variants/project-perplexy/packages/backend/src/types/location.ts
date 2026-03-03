export interface Coordinates {
  lat: number
  lng: number
}

export interface UserLocation {
  userId: string
  role: 'manager' | 'foreman' | 'labour'
  coordinates: Coordinates
  lastUpdated: Date
  projectId?: string
  userName?: string
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

export interface ActiveUser {
  userId: string
  userName: string
  role: 'manager' | 'foreman' | 'labour'
  coordinates: Coordinates
  lastUpdated: Date
  projectId?: string
  color?: string
}

