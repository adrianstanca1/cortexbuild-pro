/**
 * Request Validation Middleware
 * Uses Zod for schema validation
 */

import { Request, Response, NextFunction } from 'express'
import { z, ZodError } from 'zod'
import { ApiError } from '../utils/errors.js'

interface ValidationSchema {
  body?: z.ZodSchema
  query?: z.ZodSchema
  params?: z.ZodSchema
}

export function validateRequest(schema: ValidationSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body)
      }
      if (schema.query) {
        req.query = schema.query.parse(req.query)
      }
      if (schema.params) {
        req.params = schema.params.parse(req.params)
      }
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ApiError(400, 'Validation failed', error.errors)
      }
      throw error
    }
  }
}

