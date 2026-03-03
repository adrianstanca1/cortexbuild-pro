import { Request, Response, NextFunction } from 'express'
import { locationService } from '../services/locationService.js'
import { ApiError } from '../utils/ApiError.js'

export const locationController = {
  async updateLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const userData = (req as any).userData
      if (!userData) {
        throw new ApiError('User not found', 404)
      }

      const userId = userData.id
      const { coordinates, role, projectId, userName } = req.body

      // Map user role to location service role format
      const roleMap: Record<string, string> = {
        'SUPER_ADMIN': 'manager',
        'COMPANY_ADMIN': 'manager',
        'SUPERVISOR': 'foreman',
        'OPERATIVE': 'labour',
      }
      const locationRole = role || roleMap[userData.role] || 'labour'

      const location = await locationService.updateLocation(
        userId,
        coordinates,
        locationRole as 'manager' | 'foreman' | 'labour',
        projectId || userData.projectIds?.[0],
        userName || userData.name
      )

      res.json({
        success: true,
        location,
      })
    } catch (error) {
      next(error)
    }
  },

  async getActiveUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const userData = (req as any).userData
      const scopeFilter = (req as any).scopeFilter || {}
      const projectId = req.query.projectId as string | undefined

      let users = await locationService.getActiveUsers(projectId)

      // Apply role-based filtering
      if (userData.role === 'OPERATIVE') {
        // Operatives can only see themselves
        users = users.filter((u) => u.userId === userData.id)
      } else if (userData.role === 'SUPERVISOR') {
        // Supervisors can see team members in their projects
        users = users.filter((u) => {
          return u.projectId === projectId || userData.projectIds?.includes(u.projectId || '')
        })
      } else if (userData.role === 'COMPANY_ADMIN') {
        // Company admins can see all users in their organization
        // (Would need organizationId in ActiveUser for full filtering)
        users = users.filter((u) => {
          // For now, filter by project if specified
          return !projectId || u.projectId === projectId
        })
      }
      // SUPER_ADMIN can see all users

      res.json({
        success: true,
        users: users.map((user) => ({
          ...user,
          color: locationService.getRoleColor(user.role),
        })),
      })
    } catch (error) {
      next(error)
    }
  },

  async getUserLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params
      const location = await locationService.getUserLocation(userId)

      if (!location) {
        throw new ApiError('User location not found', 404)
      }

      res.json({
        success: true,
        location: {
          ...location,
          color: locationService.getRoleColor(location.role),
        },
      })
    } catch (error) {
      next(error)
    }
  },

  async getUsersByRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { role } = req.params

      if (!['manager', 'foreman', 'labour'].includes(role)) {
        throw new ApiError('Invalid role', 400)
      }

      const users = await locationService.getUsersByRole(role as 'manager' | 'foreman' | 'labour')

      res.json({
        success: true,
        users: users.map((user) => ({
          ...user,
          color: locationService.getRoleColor(user.role),
        })),
      })
    } catch (error) {
      next(error)
    }
  },
}

