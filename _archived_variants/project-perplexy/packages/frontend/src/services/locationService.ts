import axios from 'axios'

// Use relative URL when VITE_API_URL is empty (for Docker/nginx proxying)
// If VITE_API_URL is explicitly set to empty string, use relative URLs
// Otherwise, default to localhost for development
const API_URL = import.meta.env.VITE_API_URL === '' ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3001')

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
  color?: string
}

export interface ActiveUser {
  userId: string
  userName: string
  role: 'manager' | 'foreman' | 'labour'
  coordinates: Coordinates
  lastUpdated: Date
  projectId?: string
  color: string
}

export const locationService = {
  /**
   * Update user location
   */
  async updateLocation(
    coordinates: Coordinates,
    role: 'manager' | 'foreman' | 'labour',
    projectId?: string,
    userName?: string
  ): Promise<UserLocation> {
    const response = await axios.post(`${API_URL}/api/location/update`, {
      coordinates,
      role,
      projectId,
      userName,
    })
    return response.data.location
  },

  /**
   * Get active users
   */
  async getActiveUsers(projectId?: string): Promise<ActiveUser[]> {
    const params = projectId ? { projectId } : {}
    const response = await axios.get(`${API_URL}/api/location/active-users`, { params })
    return response.data.users
  },

  /**
   * Get user location
   */
  async getUserLocation(userId: string): Promise<UserLocation> {
    const response = await axios.get(`${API_URL}/api/location/user/${userId}`)
    return response.data.location
  },

  /**
   * Get users by role
   */
  async getUsersByRole(role: 'manager' | 'foreman' | 'labour'): Promise<ActiveUser[]> {
    const response = await axios.get(`${API_URL}/api/location/by-role/${role}`)
    return response.data.users
  },
}

