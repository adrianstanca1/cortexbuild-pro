import { Request, Response, NextFunction } from 'express'
import { ApiError } from '../utils/ApiError.js'
import logger from '../config/logger.js'

export function errorHandler(
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    })
  }

  // Default error
  logger.error('Unhandled error:', { error: err.message, stack: err.stack })
  return res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

