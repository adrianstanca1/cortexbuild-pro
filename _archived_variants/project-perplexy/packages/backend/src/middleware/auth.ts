import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../config/auth.js'
import { ApiError } from '../utils/ApiError.js'
import logger from '../config/logger.js'

// Authentication middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError('Unauthorized - No token provided', 401)
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    try {
      const decoded = verifyToken(token) as { userId: string; email: string; role: string }
      req.user = decoded
      next()
    } catch (error) {
      logger.error('Token verification error:', error)
      throw new ApiError('Unauthorized - Invalid token', 401)
    }
  } catch (error) {
    next(error)
  }
}

// Role-based access control middleware
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ApiError('Unauthorized', 401)
      }

      if (!roles.includes(req.user.role)) {
        throw new ApiError('Forbidden - Insufficient permissions', 403)
      }

      next()
    } catch (error) {
      next(error)
    }
  }
}

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        const decoded = verifyToken(token) as { userId: string; email: string; role: string }
        req.user = decoded
      } catch (error) {
        // Token invalid, but continue without authentication
        logger.warn('Optional auth token invalid:', error)
      }
    }

    next()
  } catch (error) {
    next(error)
  }
}

export { scopeFilter } from './rbac.js'

