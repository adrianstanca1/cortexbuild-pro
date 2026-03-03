import { UserLocation, Coordinates, ActiveUser } from '../types/location.js'
import { websocketService } from './websocketService.js'
import logger from '../config/logger.js'

// In-memory storage for demo (replace with database in production)
const userLocations = new Map<string, UserLocation>()
const activeUsers = new Map<string, ActiveUser>()

// Role-based color codes
export const ROLE_COLORS = {
  manager: '#000000', // Black
  foreman: '#FF8C00', // Orange
  labour: '#00FF00', // Green
}

export const locationService = {
  /**
   * Update user location
   */
  async updateLocation(
    userId: string,
    coordinates: Coordinates,
    role: 'manager' | 'foreman' | 'labour',
    projectId?: string,
    userName?: string
  ): Promise<UserLocation> {
    const location: UserLocation = {
      userId,
      role,
      coordinates,
      lastUpdated: new Date(),
      projectId: projectId || undefined,
      userName: userName || userId,
    }

    userLocations.set(userId, location)

    // Update active users
    const activeUser: ActiveUser = {
      userId,
      userName: userName || userId,
      role,
      coordinates,
      lastUpdated: new Date(),
      projectId: projectId || undefined,
      color: ROLE_COLORS[role],
    }
    activeUsers.set(userId, activeUser)

    // Broadcast location update via WebSocket (async, don't wait)
    if (projectId) {
      this.getActiveUsers(projectId)
        .then((projectUsers) => {
          websocketService.broadcastLocationUpdate(projectId, projectUsers)
        })
        .catch((error) => {
          logger.error('Failed to broadcast location update', { error: error.message })
        })
    }

    return location
  },

  /**
   * Get user location
   */
  async getUserLocation(userId: string): Promise<UserLocation | null> {
    return userLocations.get(userId) || null
  },

  /**
   * Get all active users
   */
  async getActiveUsers(projectId?: string): Promise<ActiveUser[]> {
    let users = Array.from(activeUsers.values())
    
    if (projectId) {
      users = users.filter((user) => {
        const location = userLocations.get(user.userId)
        return location?.projectId === projectId
      })
    }

    // Ensure all users have color
    return users.map((user) => ({
      ...user,
      color: user.color || ROLE_COLORS[user.role],
    }))
  },

  /**
   * Remove inactive users (older than 30 minutes)
   */
  async cleanupInactiveUsers(): Promise<void> {
    const now = new Date()
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000)

    for (const [userId, user] of activeUsers.entries()) {
      if (user.lastUpdated < thirtyMinutesAgo) {
        activeUsers.delete(userId)
        userLocations.delete(userId)
      }
    }
  },

  /**
   * Get users by role
   */
  async getUsersByRole(role: 'manager' | 'foreman' | 'labour'): Promise<ActiveUser[]> {
    return Array.from(activeUsers.values()).filter((user) => user.role === role)
  },

  /**
   * Get color for role
   */
  getRoleColor(role: 'manager' | 'foreman' | 'labour'): string {
    return ROLE_COLORS[role]
  },
}

// Cleanup inactive users every 5 minutes
setInterval(() => {
  locationService.cleanupInactiveUsers().catch((error) => {
    logger.error('Failed to cleanup inactive users', { error: error.message })
  })
}, 5 * 60 * 1000)

