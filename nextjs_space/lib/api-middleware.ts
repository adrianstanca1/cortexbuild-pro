/**
 * API Route Wrapper with Security Middleware
 * 
 * Provides a wrapper for API routes with automatic security checks:
 * - Rate limiting
 * - CSRF protection
 * - Request size limits
 * - Input validation
 * - Structured logging
 * - Error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { checkRateLimit, getRateLimitIdentifier, rateLimiters } from '@/lib/rate-limiter';
import { checkCsrf } from '@/lib/csrf';
import { checkRequestSize, REQUEST_SIZE_LIMITS, applySecurityHeaders } from '@/lib/security';
import { createRequestLogger, logger, sanitizeLogData } from '@/lib/logger';
import { validateRequest, formatValidationErrors } from '@/lib/validation-schemas';
import { z } from 'zod';

export interface ApiHandlerOptions {
  /**
   * Rate limiter to use (default: rateLimiters.api)
   */
  rateLimiter?: ReturnType<typeof import('@/lib/rate-limiter').createRateLimiter>;
  
  /**
   * Whether to check CSRF token (default: true for POST/PUT/PATCH/DELETE)
   */
  checkCsrf?: boolean;
  
  /**
   * Request size limit in bytes (default: 1MB)
   */
  sizeLimit?: number;
  
  /**
   * Validation schema for request body
   */
  bodySchema?: z.ZodSchema;
  
  /**
   * Validation schema for query parameters
   */
  querySchema?: z.ZodSchema;
  
  /**
   * Whether authentication is required (default: true)
   */
  requireAuth?: boolean;
  
  /**
   * Required roles for access
   */
  requiredRoles?: string[];
  
  /**
   * Whether to log request/response (default: true)
   */
  enableLogging?: boolean;
}

export interface ApiContext {
  session: Awaited<ReturnType<typeof getServerSession>> | null;
  logger: ReturnType<typeof createRequestLogger>;
  body?: any;
  query?: any;
}

export type ApiHandler = (
  request: NextRequest,
  context: ApiContext
) => Promise<NextResponse | Response>;

/**
 * Wrap an API handler with security middleware
 */
export function withApiMiddleware(
  handler: ApiHandler,
  options: ApiHandlerOptions = {}
) {
  const {
    rateLimiter = rateLimiters.api,
    checkCsrf: shouldCheckCsrf = true,
    sizeLimit = REQUEST_SIZE_LIMITS.default,
    bodySchema,
    querySchema,
    requireAuth = true,
    requiredRoles,
    enableLogging = true,
  } = options;
  
  return async (request: NextRequest) => {
    const startTime = performance.now();
    let requestLogger = logger;
    
    try {
      // Get session first (for logging context)
      const session = await getServerSession(authOptions);
      const userId = session?.user?.id ?? undefined;
      const organizationId = session?.user?.organizationId ?? undefined;
      
      // Create request logger
      if (enableLogging) {
        requestLogger = createRequestLogger(request, userId || undefined, organizationId || undefined);
        requestLogger.logRequest(request.method, request.nextUrl.pathname);
      }
      
      // Check authentication
      if (requireAuth && !session) {
        const response = NextResponse.json(
          { error: 'Unauthorized', message: 'Authentication required' },
          { status: 401 }
        );
        
        if (enableLogging) {
          requestLogger.warn('Unauthorized request');
        }
        
        return applySecurityHeaders(response);
      }
      
      // Check role-based access
      if (requiredRoles && session) {
        const userRole = session.user.role;
        if (!requiredRoles.includes(userRole)) {
          const response = NextResponse.json(
            { error: 'Forbidden', message: 'Insufficient permissions' },
            { status: 403 }
          );
          
          if (enableLogging) {
            requestLogger.warn('Forbidden - insufficient permissions', {
              userRole,
              requiredRoles,
            });
          }
          
          return applySecurityHeaders(response);
        }
      }
      
      // Rate limiting
      const identifier = getRateLimitIdentifier(request, userId);
      const rateLimitConfig = {
        windowMs: 60 * 1000,
        maxRequests: 100,
        message: 'Too many requests, please slow down.',
      };
      const rateLimitResult = await checkRateLimit(rateLimiter, identifier, rateLimitConfig);
      if (!rateLimitResult.ok) {
        if (enableLogging) {
          requestLogger.warn('Rate limit exceeded', { identifier });
        }
        return applySecurityHeaders('response' in rateLimitResult ? rateLimitResult.response : NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 }));
      }
      
      // CSRF protection
      if (shouldCheckCsrf) {
        const csrfResult = await checkCsrf(request);
        if (!csrfResult.ok) {
          if (enableLogging) {
            requestLogger.warn('CSRF validation failed');
          }
          return applySecurityHeaders('response' in csrfResult ? csrfResult.response : NextResponse.json({ error: 'CSRF validation failed' }, { status: 403 }));
        }
      }
      
      // Request size check
      const sizeResult = await checkRequestSize(request, sizeLimit);
      if (!sizeResult.ok) {
        if (enableLogging) {
          requestLogger.warn('Request size limit exceeded');
        }
        return applySecurityHeaders('response' in sizeResult ? sizeResult.response : NextResponse.json({ error: 'Request too large' }, { status: 413 }));
      }
      
      // Parse and validate request body
      let body;
      if (bodySchema && request.method !== 'GET') {
        try {
          const rawBody = await request.json();
          const validation = await validateRequest(bodySchema, rawBody);
          
          if (!validation.success) {
            // Type narrowing: if success is false, errors exists
            const validationErrors = 'errors' in validation ? validation.errors : null;
            if (!validationErrors) {
              return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
            }
            const errors = formatValidationErrors(validationErrors);
            const response = NextResponse.json(
              {
                error: 'Validation failed',
                message: 'Invalid request data',
                errors,
              },
              { status: 400 }
            );
            
            if (enableLogging) {
              requestLogger.warn('Request validation failed', {
                errors: sanitizeLogData(errors),
              });
            }
            
            return applySecurityHeaders(response);
          }
          
          body = validation.data;
        } catch (error) {
          const response = NextResponse.json(
            { error: 'Invalid JSON', message: 'Request body must be valid JSON' },
            { status: 400 }
          );
          
          if (enableLogging) {
            requestLogger.warn('Invalid JSON in request body');
          }
          
          return applySecurityHeaders(response);
        }
      }
      
      // Parse and validate query parameters
      let query;
      if (querySchema) {
        const searchParams = Object.fromEntries(request.nextUrl.searchParams);
        const validation = await validateRequest(querySchema, searchParams);
        
        if (!validation.success) {
          // Type narrowing: if success is false, errors exists
          const validationErrors = 'errors' in validation ? validation.errors : null;
          if (!validationErrors) {
            return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
          }
          const errors = formatValidationErrors(validationErrors);
          const response = NextResponse.json(
            {
              error: 'Validation failed',
              message: 'Invalid query parameters',
              errors,
            },
            { status: 400 }
          );
          
          if (enableLogging) {
            requestLogger.warn('Query validation failed', { errors });
          }
          
          return applySecurityHeaders(response);
        }
        
        query = validation.data;
      }
      
      // Call the actual handler
      const context: ApiContext = {
        session,
        logger: requestLogger,
        body,
        query,
      };
      
      const response = await handler(request, context);
      
      // Log response
      if (enableLogging) {
        const duration = Math.round(performance.now() - startTime);
        requestLogger.logResponse(
          request.method,
          request.nextUrl.pathname,
          response.status,
          duration
        );
      }
      
      // Apply security headers
      return applySecurityHeaders(response);
      
    } catch (error) {
      // Log error
      if (enableLogging) {
        requestLogger.error('Unhandled error in API route', error);
      }
      
      // Don't leak error details in production
      const message = process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : error instanceof Error
        ? error.message
        : 'Unknown error';
      
      const response = NextResponse.json(
        { error: 'Internal server error', message },
        { status: 500 }
      );
      
      return applySecurityHeaders(response);
    }
  };
}

/**
 * Helper to create authenticated API handler
 */
export function authenticatedApiHandler(
  handler: ApiHandler,
  options: Omit<ApiHandlerOptions, 'requireAuth'> = {}
) {
  return withApiMiddleware(handler, { ...options, requireAuth: true });
}

/**
 * Helper to create public API handler
 */
export function publicApiHandler(
  handler: ApiHandler,
  options: Omit<ApiHandlerOptions, 'requireAuth'> = {}
) {
  return withApiMiddleware(handler, { ...options, requireAuth: false });
}

/**
 * Helper to create admin-only API handler
 */
export function adminApiHandler(
  handler: ApiHandler,
  options: Omit<ApiHandlerOptions, 'requireAuth' | 'requiredRoles'> = {}
) {
  return withApiMiddleware(handler, {
    ...options,
    requireAuth: true,
    requiredRoles: ['SUPER_ADMIN', 'COMPANY_OWNER', 'ADMIN'],
  });
}
